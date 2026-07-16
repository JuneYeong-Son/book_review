# 백엔드 / 로직 요청 기록

> 사용자가 대화 중 요청한 **백엔드·데이터·로직 관련** 사항 모음. (전체 개요는 ../requirements.md)

## 구조 / 컨벤션
- 백엔드는 **controller → service → repository** 3계층.
- 폴더 snake_case + **단수형**(`controller`/`service`/`repository`), 파일 snake_case(`auth_controller.ts`).
- 함수 camelCase. 소스는 `server/src/` 아래, DB(`prisma/`)와 분리.
- **추천 코드는 별도 폴더** `server/src/recommendation/` 에 작성.

## 인증
- **이메일 인증 2단계 회원가입**: `POST /auth/register/start`(검증→인증코드 메일)·`POST /auth/register/verify`(코드 확인→User 생성+로그인). 대기 데이터는 `EmailVerification`에 임시 저장.
  - 수집: 아이디(로그인용)·이메일(**unique**)·이름(비공개)·**닉네임**(활동 표시명, unique)·**휴대폰**·비밀번호·(선택)출생연도 + **개인정보 수집·이용 동의 필수**(`agreedAt` 기록).
  - 실시간 중복 확인: `GET /auth/check/nickname?value=`·`GET /auth/check/email?value=` → `{available, message}`.
  - 발송: Resend HTTP API(`email_service.ts`). `RESEND_API_KEY` 미설정 시 콘솔 출력 + 응답 `devCode`(테스트 모드).
  - 표시명은 `nickname` 우선, 없으면 `name`(기존 계정 폴백).
- 로그인 / 로그아웃.
- **소셜 로그인(카카오·구글)**: `GET /auth/oauth/{kakao|google}`(동의화면)·`/callback`(code→토큰→프로필→로그인/가입→세션쿠키→프론트 복귀). `User.provider`·`providerId`로 식별(`resolveSocialUser` 공통). 연동 정책: 소셜계정 존재→로그인 / 같은 이메일→연결 / 없으면 신규 생성. env: 카카오 `KAKAO_REST_API_KEY`(+선택 `KAKAO_CLIENT_SECRET`), 구글 `GOOGLE_CLIENT_ID`·`GOOGLE_CLIENT_SECRET`(둘 다 필요). 미설정 제공자는 비활성.
- **내 정보 수정**: 프로필(이름·아바타) 변경, **비밀번호 변경**, **회원 탈퇴**(관련 데이터 cascade 삭제).
- **비밀번호 보안 정책**(`validatePassword`): **8자 이상 + 영문·숫자 혼합**. 회원가입·비밀번호 변경 공통 적용.
- **활동 정지(`User.suspended`)**: 정지 계정은 로그인 차단(403) + `requireAuth`에서도 차단(미들웨어 async — 매 인증 요청 시 계정 존재·정지 여부 확인).

## 관리자 — 회원 관리
- `GET /admin/members` 전체 회원 목록.
- `PATCH /admin/members/:id/admin` 관리자 권한 부여/회수, `PATCH /admin/members/:id/suspend` 활동 정지/해제, `DELETE /admin/members/:id` 회원 삭제(cascade).
- 가드: **본인** 권한변경·정지·삭제 불가, **다른 관리자**는 먼저 권한 회수해야 정지·삭제 가능.

## 공지사항
- `Notice{ title, body, pinned }`. 공개 `GET /notices`(고정 우선·최신순), 관리자 `POST/PATCH/DELETE /notices[/:id]`(requireAuth+requireAdmin). 제목 2자·내용 5자 이상 검증. 홈 배너(최상단 공지)·`/notices` 목록에 노출.

## 피드백 / 버그 신고
- `Feedback` 모델(User와 하드관계 없음 — 비로그인 허용, 제출 시점 이름 저장). 필드: `kind`(feedback|bug)·`message`·`page`·`resolved`.
- `POST /feedback` 제출(비로그인 가능, IP 레이트리밋 10분 5회, 로그인 시 이름 기록). 관리자 `GET /admin/feedback`·`PATCH /admin/feedback/:id/resolve`·`DELETE /admin/feedback/:id`.

## 독서 기록 / 서평
- 오늘 무슨 책을 **몇 페이지부터 몇 페이지까지** 읽었는지 기록. 다른 사람도 열람 가능.
- **별점** + 서평(note) + **인상깊은 글귀(quote, 선택)**.
- 기록할 때마다 새 항목이 쌓여 **날짜별 이력**.
- **서평 순번(`bookSeq`)은 `max(bookSeq)+1`** 로 매긴다(과거 `count+1`은 삭제 후 순번이 재사용돼 `/books/:id/reviews/:seq`가 다른 서평을 열던 버그 → 수정). 조회는 `createdAt asc` 고정.
- **과하게 짧은 글 방지**: 서평 note는 적었을 경우 10자 이상(빈 값은 쪽수만 남기는 기록으로 허용). 토론은 제목 2자·내용 10자 이상.
- **서평은 내 서재(관심)에 담은 책만** 작성 가능(프론트 게이팅).
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

## 토론 목록 스코프 (구현됨)
- **책별 토론 스코프**: `GET /discussions?bookId=…` 지원. 예전엔 책 상세가 `/discussions` 전체를 받아 클라이언트에서 `book.id`로 필터했으나(콘텐츠 증가 시 전량 다운로드), 이제 백엔드에서 해당 책 토론만 반환한다. `findAllDiscussions(skip, take, bookId)` → `where: bookId ? { bookId } : undefined`. 프론트 [book_reviews_page.tsx](../../frontend/src/pages/book_reviews_page.tsx)가 이 파라미터를 사용. (Vercel react-best-practices의 오버페치 지적 해소.)

## 배포/DB
- 로컬 SQLite, 배포 PostgreSQL. 빌드 시 `scripts/use-postgres.mjs`로 provider 자동 전환.
- 배포 시 cross-site 쿠키(SameSite=None; Secure), CORS는 env `FRONTEND_URL`.
- 시드 예시 확장(계정 5명: reader/bookworm/soyul/cheol/essay).
