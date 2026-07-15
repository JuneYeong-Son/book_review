# 서평 사이트 — 요구사항 기록

> 사용자가 대화 중 요청한 내용을 시간순으로 정리한 문서. 앞으로 작업 시 이 문서를 참고한다.
> (최초 작성: 2026-07-16)

## 1. 프로젝트 개요
- **무엇**: 서평(독서 기록)을 쓰는 웹사이트
- **프론트엔드**: React + Vite (`frontend/` 폴더)
- **백엔드**: Express + TypeScript, SQLite + Prisma (`server/` 폴더)
- **아키텍처**: controller → service → repository 3계층

## 2. 네이밍 컨벤션 (엄수)
- **폴더**: snake_case, 그리고 **단수형** — `controller`, `service`, `repository`
- **파일**: snake_case + 언더스코어 — 예) `auth_controller.ts` (❌ `auth.controller.ts`)
- **함수 이름**: camelCase — 예) `loginUser`, `upsertProgress`
  - (예외: React 컴포넌트 함수는 문법상 PascalCase 사용)
- **소스 코드 위치**: DB 파일과 구분되도록 `server/src/` 아래에 모음.
  DB 관련(`prisma/`, `dev.db`)은 `src/` 밖에 둔다.

## 3. 핵심 기능
1. **로그인 / 로그아웃** (회원가입 포함)
2. **독서 기록**: 오늘 무슨 책을 어디까지(페이지) 읽었는지 기록.
   - 다른 사람도 그 기록을 볼 수 있다.
3. **서평 + 별점**: 서평을 쓸 때 별점(0~5)을 매길 수 있다.
   - 독서 기록에 서평 내용(note)과 별점(rating)이 함께 저장된다.
4. **관심 책 지정**: 자신이 관심 있는 책을 지정할 수 있다.
5. **토론**:
   - 사람들은 **자신이 읽었거나 읽는 중인 책**(= 진행 기록이 있는 책)에 대해서만 토론을 열 수 있다.
   - 토론이 열리면 **로그인한 누구나 댓글로 참여**할 수 있다.
6. **마이페이지**: 자신이 남긴 서평(독서 기록)과 참여한 토론(내가 연 토론 + 댓글 단 토론)을 모아본다.
   - 우상단 **아바타(이모지) 동그라미 버튼** 클릭 → 드롭다운(마이페이지/로그아웃).
   - 아바타는 **회원가입 시 이모지 중에서 선택**.
   - 마이페이지에서 책별로 눌러 **책별 상세 페이지**로 이동 → 그 책에 남긴 서평을 **날짜별**로 봄.
7. **독서 기록 검색**: 독서 기록 페이지에서 책 제목·저자·작성자 이름으로 검색(프론트 필터).
8. **독서 기록 형식**: "몇 페이지부터 몇 페이지까지"(startPage~endPage) + 서평(note) + **별점** +
   **인상깊은 글귀(quote, 선택)**. 기록할 때마다 새 항목이 쌓여 날짜별 이력이 됨.
9. **좋아요**: 서평(독서 기록)에 다른 사람들이 좋아요를 누를 수 있음.
10. **알림**: 🔔 버튼. 내가 연 토론에 댓글이 달리거나, 내 서평에 좋아요가 눌리면 알림 목록에 쌓임.
    알림 클릭 시 해당 페이지(토론/서평)로 이동. 안 읽은 알림 수 배지 표시.

## 3-1. 외부 책 데이터 (알라딘 OpenAPI 연동, 구현됨)
- 책 제목·저자·표지·카테고리(장르)·ISBN을 **알라딘 OpenAPI**에서 가져와 우리 `Book`에 저장.
- 흐름: 홈의 "새 책 추가" 패널 → 검색(`GET /books/search/external?q=`) → 추가(`POST /books/import`).
- 우리 SQLite `Book`을 캐시로 사용(ISBN 중복 방지). 카테고리 문자열 "국내도서>소설>고전"을
  `category`(중간)·`genre`(마지막)로 파싱.
- **키 필요**: `server/.env`의 `ALADIN_TTB_KEY`. https://www.aladin.co.kr/ttb/apiguide.aspx 에서 발급.
  키 없으면 검색 시 안내 메시지(502) 반환.

## 3-2. UI/레이아웃 (구현됨)
- **헤더**: 네비게이션 링크 제거. 좌측 "📖 책갈피", 우측 🔔 알림 버튼 + 프로필(아바타) 버튼만.
  - 프로필 클릭 → 드롭다운: **내 서평 / 내 책 / 내 토론 / 내 정보 수정 / 로그아웃**.
- **메인(홈)**: 히어로 문구 "책을 기록하고, 당신의 세계를 다른 사람과 나눠보세요" + 액션 버튼.
  - **서평 섹션**(가로 전체 폭): 관심 책 우선 + 좋아요 많은 순 정렬.
  - **토론 섹션**(가로 전체 폭): 관심 책 우선 + 댓글(인기) 많은 순 정렬.
  - **"🤖 이런 책을 추천해요!"**: 머신러닝(콘텐츠 기반 추천) 결과 + 추천 이유. 책 추가(알라딘) 패널 포함.
- **액션 버튼(모달)**: 히어로에 **서평 쓰기 / 관심 책 추가 / 토론 열기** 버튼 → 모달로 처리.
- **마이페이지**: 탭(내 서평 / 내 책 / 내 토론). `?tab=reviews|books|discussions`.
- **내 정보 수정(/settings)**: 프로필(이름·아바타) 수정, 비밀번호 변경, 회원 탈퇴.
- **푸터**: 이름(JuneYeongSon) + 이메일(ic59673515@gmail.com).

## 3-3. 추천 시스템 (콘텐츠 기반, 구현됨)
- `recommendation_service.ts`: 내가 읽은/관심 책의 genre·category·author feature 가중치를 만들고,
  안 본 책을 유사도 + 인기도로 점수화해 상위 추천. 이력 없으면 인기순 폴백.
- `GET /books/recommendations` (선택적 로그인 → 개인화/인기순).
- 향후 협업 필터링·임베딩 기반으로 확장 가능(§4 참고).
- 알라딘 표지: 시드가 실행 시 알라딘에서 각 책의 실제 표지·장르를 가져옴(키 없으면 폴백).

## 4. 향후 기능 (나중에 구현)
- **책 큐레이션 타이틀/컬렉션**: 책에 "서울대 추천도서 100선", "요즘 인기있는 도서" 같은
  타이틀(컬렉션)을 달 수 있게 하고 싶음.
  - 설계 제안: `Collection { id, title }` 모델 + `Book`과 다대다(N:M) 관계
    (`CollectionBook` 조인 테이블). 한 책이 여러 컬렉션에 속할 수 있음.
- **추천 시스템**: 사용자가 읽은 책을 바탕으로 책을 추천.
  - (a) 협업 필터링: 나와 비슷한 책을 읽은 사용자들이 많이 읽은 책 추천.
  - (b) 콘텐츠 기반: 내가 읽은 책과 장르/카테고리/작가가 비슷한 책 추천.
  - 이를 위해 `Book`에 `genre`, `category` 필드를 미리 추가해 둠(작가 `author`는 기존 존재).
- **사용자 태그(ML)**: 딥러닝 또는 클러스터링으로 사용자에게 취향 태그 부여.
  - 예) "해외문학 선호", "철학가", "비문학 애호가".
  - 피처: 사용자가 읽은 책들의 `genre`/`category`/`author` 분포 → 클러스터링(K-means 등)
    또는 임베딩 기반 분류. 결과를 `UserTag { userId, tag }`로 저장하는 설계 제안.

## 5. 데이터 모델 (현재)
- `User(id, username, name, passwordHash, avatar)`
- `Book(id, title, author, cover, genre, category)`
- `Progress(id, userId, bookId, startPage, endPage, note, quote, rating, createdAt)` — 책당 여러 개(날짜별 이력)
- `Like(id, userId, progressId)` — 서평 좋아요 (@@unique[userId, progressId])
- `Notification(id, userId, type, message, link, read, createdAt)` — 알림
- `Interest(id, userId, bookId)` — 관심 책
- `Discussion(id, bookId, ownerId, title, description)`
- `Comment(id, discussionId, userId, text)`

## 6. 기타 메모
- 기존 홈 디렉토리(`C:/Users/손`) 전체가 팀 저장소(`proteiin/nb04-seven-team1`)에 연결된
  git 저장소였음. `book_review`는 **독립 git 저장소**로 새로 만들어
  `https://github.com/JuneYeong-Son/book_review.git` 에 연결한다.
- 시드 계정: `reader` / 비밀번호 `password`
