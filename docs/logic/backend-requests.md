# 백엔드 / 로직 요청 기록

> 사용자가 대화 중 요청한 **백엔드·데이터·로직 관련** 사항 모음. (전체 개요는 ../requirements.md)

## 구조 / 컨벤션
- 백엔드는 **controller → service → repository** 3계층.
- 폴더 snake_case + **단수형**(`controller`/`service`/`repository`), 파일 snake_case(`auth_controller.ts`).
- 함수 camelCase. 소스는 `server/src/` 아래, DB(`prisma/`)와 분리.
- **추천 코드는 별도 폴더** `server/src/recommendation/` 에 작성.

## 인증
- 회원가입 / 로그인 / 로그아웃.
- **내 정보 수정**: 프로필(이름·아바타) 변경, **비밀번호 변경**, **회원 탈퇴**(관련 데이터 cascade 삭제).

## 독서 기록 / 서평
- 오늘 무슨 책을 **몇 페이지부터 몇 페이지까지** 읽었는지 기록. 다른 사람도 열람 가능.
- **별점** + 서평(note) + **인상깊은 글귀(quote, 선택)**.
- 기록할 때마다 새 항목이 쌓여 **날짜별 이력**.
- 책별 내 서평 조회, 한 책의 모든 서평 조회, 서평 상세 조회.
- **서평 좋아요**. **서평 댓글**(작성 시 서평 작성자에게 알림).
- 독서 기록 검색(책 제목·저자·작성자명 — 프론트 필터).

## 관심 책 / 토론
- 관심 책 지정(토글).
- 토론: **자신이 읽었거나 읽는 중인 책만 개설** 가능, 로그인한 **누구나 댓글**.
- 토론 댓글 작성 시 토론 개설자에게 알림.
- **"새 책 추가"(알라딘 임포트)와 "관심 책 추가"를 하나로 통합**.

## 알림
- 내 토론에 댓글 / 내 서평에 좋아요·댓글 → 알림 목록에 쌓임. 클릭 시 해당 페이지 이동. 안읽음 배지.

## 외부 데이터 (알라딘 OpenAPI)
- 책 제목·정보(장르/카테고리)·**표지 이미지**를 알라딘에서 가져오기.
- 키워드 검색 임포트, 시드가 실제 표지 보강.
- **베스트셀러**(요즘 많이 사는 책) 조회, **CategoryId로 장르 필터**.
- 키는 `server/.env`의 `ALADIN_TTB_KEY`.

## 추천 시스템 (server/src/recommendation/)
- `content` — 읽은 책과 비슷: genre/category/author 유사도 + **별점·recency 가중** + 관심 책 강한 신호 + 인기도.
- `popular` — 요즘 많이 사는 책: 알라딘 베스트셀러(+장르 필터).
- 엔드포인트 `GET /books/recommendations?method=content|popular&categoryId=...`.
- 향후: 협업 필터링 / 임베딩 기반 하이브리드.

## 서평 상세/편집/댓글/URL (추가)
- **서평 댓글**: 서평에도 댓글(ReviewComment). 남의 서평에 댓글 시 작성자에게 알림.
- **서평 편집/삭제**: 본인 서평만 `PATCH/DELETE /progress/:id`. 서평 상세·마이페이지 책별 페이지에서.
- **서평 URL 구조**: 책이 있어야 서평이 있으므로 `/books/:bookId/reviews/:bookSeq`.
  `Progress.bookSeq`(책별 순번, 저장 시 count+1). 조회: `GET /progress/book/:bookId/seq/:seq`.

## 책 단위 별점 (변경)
- 별점을 **서평마다가 아니라 책 자체에** 매김. `Rating(userId, bookId, value)` @@unique.
- `POST /books/:id/rating`, `GET /books/:id/rating`(평균·개수·내 별점). 서평 폼/표시에서 별점 제거.

## 추천 (변경/추가)
- **"읽은 책과 비슷한 책" = 아이템 기반 협업 필터링(CF)**: 책×사용자(읽음+좋아요) 코사인 유사도.
  희소하면 콘텐츠 기반으로 보충. (`recommendation/item_cf.ts`) — 기존 content 옵션이 이걸로 대체.
- **연령대 옵션은 UI에서 제거**(백엔드 age_group 코드는 유지, 나중에 복구).
- **추천 제외 리스트**: `RecoExclusion(userId, bookId)`. 추천 카드 X → `POST /books/:id/reco-exclude`.
  content/CF에서 제외. `GET/DELETE /books/:id/reco-exclude`.
- **특정 책 제외**: `recommendation/exclusions.ts`(코드 기본 + env `RECO_EXCLUDE_TITLES`). 예) '82년생 김지영'.

## 유저 프로필 / 신고 / 관리자 (추가)
- **공개 프로필**: `GET /users/:id` → 그 유저의 서평·서재(관심)·토론.
- **신고**: `POST /reports` (targetType: review | discussion | user), Report 모델.
- **관리자**: env `ADMIN_USERNAMES`(기본 reader). `/api/admin` (requireAdmin):
  - `GET /admin/stats` (오늘 접속자=User.lastSeenAt, 회원 수, 신고된 게시물 수)
  - `GET /admin/reports` (신고 많은 순), `DELETE /admin/posts/:type/:id` (게시물·회원 삭제)

## 책 중복/임포트 (변경)
- 임포트 중복 판단: ISBN이 같거나 **(제목 + 작가(지은이))** 가 같으면 동일 책(옮긴이/판형 무시).
  작가는 `primaryAuthor`로 정규화(옮긴이 제거).

## 페이지네이션
- `/progress`, `/discussions`에 `skip`/`take`. 알라딘 베스트셀러는 `start`(페이지). 무한 캐러셀에 사용.

## 개선 제안 (미구현 · 프론트 감사에서 도출)
- **책별 토론 스코프 엔드포인트**: 현재 책 상세([book_reviews_page.tsx](../../frontend/src/pages/book_reviews_page.tsx))가 `/discussions` 전체를 받아 클라이언트에서 `book.id`로 필터한다 → 콘텐츠가 늘수록 불필요하게 전량 다운로드. 백엔드에 `GET /discussions?bookId=…` 스코프 파라미터를 추가하면 프론트에서 그 책 토론만 받게 개선 가능. (Vercel react-best-practices의 워터폴/오버페치 관점 지적사항.)

## 배포/DB
- 로컬 SQLite, 배포 PostgreSQL. 빌드 시 `scripts/use-postgres.mjs`로 provider 자동 전환.
- 배포 시 cross-site 쿠키(SameSite=None; Secure), CORS는 env `FRONTEND_URL`.
- 시드 예시 확장(계정 5명: reader/bookworm/soyul/cheol/essay).
