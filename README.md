# 📖 책갈피 — 서평 사이트

책을 읽고 어디까지 읽었는지 기록하고, 서평·별점·인상깊은 글귀를 남기고,
읽은 책으로 토론을 열고, 취향에 맞는 책을 추천받는 웹사이트.

## 🔄 다시 시작할 때 (Onboarding)

나중에 이 프로젝트를 다시 열었을 때 빠르게 기억하기 위한 요약.

- **먼저 읽기**: 이 README → 아래 "주요 기능" → 세부는 `docs/`.
  - 내가 했던 **UI 요청** = `docs/design/ui-requests.md`, **백엔드 요청** = `docs/logic/backend-requests.md`
  - **데이터 모델/개요** = `docs/requirements.md`, **남은 일** = `docs/todo.md`, **배포** = `docs/deploy.md`
- **바로 실행**: 아래 "로컬 실행"대로 `server`·`frontend`에서 `npm install` → `npm run dev`. 로컬은 SQLite라 DB 설치 불필요.
- **꼭 기억할 것(gotcha)**:
  - 로컬은 **SQLite**(`server/prisma/dev.db`), 배포는 **PostgreSQL**. 빌드 때 `scripts/use-postgres.mjs`가 자동 전환하니 **`schema.prisma`의 provider는 `sqlite`로 두기**.
  - 알라딘 기능엔 `server/.env`의 `ALADIN_TTB_KEY` 필요.
  - GitHub 원격은 `JuneYeong-Son/book_review`. (이 PC엔 자격증명이 저장돼 있어 push 가능)
  - 관리자 계정 = `reader`(env `ADMIN_USERNAMES`).

## 🌐 배포 (Live)

- 프론트엔드: https://book-review-frontend-ov6h.onrender.com
- 백엔드 API: https://book-review-api-xsmv.onrender.com
- 데모 계정 (비번 공통 `password`): `reader`, `bookworm`, `soyul`, `cheol`, `essay`

> 무료 플랜이라 백엔드가 잠들어 있으면 첫 접속에 ~30초 콜드스타트가 있을 수 있어요.

## 🛠 기술 스택

- **프론트엔드**: React + Vite + React Router (`frontend/`)
- **백엔드**: Express + TypeScript, Prisma ORM (`server/`, tsx로 실행)
- **DB**: 로컬은 **SQLite**, 배포는 **PostgreSQL** (빌드 시 자동 전환 — `scripts/use-postgres.mjs`)
- **외부 API**: 알라딘 OpenAPI (책 검색·표지·베스트셀러)
- **배포**: Render (Blueprint: `render.yaml`)

## 📁 구조

```
book_review/
├─ server/                # 백엔드
│  ├─ prisma/             # 스키마 · 시드 (소스와 분리)
│  ├─ scripts/            # 배포용 provider 전환 스크립트
│  └─ src/
│     ├─ controller/      # 요청/응답 (auth·book·progress·discussion·notification·report·admin·user)
│     ├─ service/         # 비즈니스 로직
│     ├─ repository/      # DB 접근 (Prisma)
│     ├─ recommendation/  # 추천 로직 (content·item_cf·popularity·age_group·exclusions)
│     ├─ middleware/      # 인증 · 관리자
│     └─ lib/             # Prisma 클라이언트, 쿠키, 관리자 설정
├─ frontend/              # 프론트엔드
│  └─ src/{page, component, api, lib}
├─ docs/                  # 요구사항·설계·백엔드·배포·todo 문서
├─ render.yaml            # Render 배포 블루프린트
└─ docker-compose.yml     # (선택) 로컬 Postgres
```

### 네이밍 컨벤션
- 폴더: `snake_case` + 단수형 (`controller`, `service`, `repository`)
- 파일: `snake_case` (`auth_controller.ts`)
- 함수: `camelCase` (React 컴포넌트만 PascalCase)

## ✨ 주요 기능

- **계정**: 회원가입(아바타·출생연도 선택) / 로그인·로그아웃 / 내 정보 수정(이름·아바타·비밀번호 변경·회원 탈퇴)
- **독서 기록·서평**: 몇 페이지부터 몇 페이지까지 + 서평 + 인상깊은 글귀(선택), 날짜별 이력.
  본인 서평은 상세에서 **수정/삭제**. 서평 URL은 `/books/{책}/reviews/{책별 순번}` 형식.
- **책 단위 별점**: 별점은 서평마다가 아니라 **책 자체에** 매김(책 상세에서 평균·내 별점).
- **좋아요 / 댓글**: 서평·토론에 좋아요, 서평·토론에 댓글.
- **관심 책 (내 서재)**: 관심 책 지정. 마이페이지 '내 서재'에서 관리(제거 버튼).
- **토론**: 읽었거나 읽는 중인 책만 개설 가능, 로그인한 누구나 댓글 참여.
- **알림 🔔**: 내 토론에 댓글 / 내 서평에 좋아요·댓글 시 알림 → 클릭 시 해당 페이지 이동, 안읽음 배지.
- **유저 프로필**: 이름 클릭 → 그 사용자의 서평·서재·토론 열람.
- **신고 / 관리자**: 서평·토론·사용자 신고. 관리자 대시보드(`/admin`)에서 오늘의 접속자 수·회원 수·
  신고된 게시물 수 + 신고 많은 게시물/회원 삭제. (관리자 지정: env `ADMIN_USERNAMES`, 기본 `reader`)
- **마이페이지**: 독서 **달력** + 탭(내 서평 / 내 서재 / 내 글귀 / 내 토론).
- **추천하는 책** (필터 버튼으로 방식 선택):
  - **읽은 책과 비슷한 책**: 아이템 기반 **협업 필터링(CF)** + 콘텐츠 기반(장르·카테고리·작가) 보충.
  - **요즘 많이 사는 책**: 알라딘 **베스트셀러**(주제 필터, 무한 로드).
  - 추천 카드의 **X** 버튼 → '추천 안 받을 책' 리스트에 담아 다시 안 뜨게(다른 책으로 교체).
- **책 검색·추가**: 알라딘 검색으로 실제 표지와 함께 추가. **제목+작가가 같으면(옮긴이·판형 무시) 같은 책**으로 취급.
- **캐러셀**: 서평·토론·추천을 가로로 넘겨보기(‹ ›), 끝에서 계속 더 불러오기(페이지네이션).

## 🚀 로컬 실행

로컬은 **SQLite**를 사용해 별도 DB 설치가 필요 없습니다.

```bash
# 1) 백엔드
cd server
npm install
cp .env.example .env          # DATABASE_URL="file:./dev.db", ALADIN_TTB_KEY 설정
npm run db:push               # 스키마 반영 (dev.db 생성)
npm run seed                  # 예시 데이터 (계정 5명)
npm run dev                   # http://localhost:4000

# 2) 프론트엔드 (새 터미널)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

`ALADIN_TTB_KEY`는 https://www.aladin.co.kr/ttb/apiguide.aspx 에서 발급.

## ☁️ 배포

Render Blueprint(`render.yaml`)로 백엔드 + 프론트 + Postgres를 한 번에 생성합니다.
빌드 시 `scripts/use-postgres.mjs`가 Prisma provider를 자동으로 postgresql로 전환합니다.
자세한 절차는 [`docs/deploy.md`](docs/deploy.md) 참고.

## 📌 향후 계획

`docs/todo.md` 참고 — 협업 필터링 고도화(임베딩), 책 컬렉션 타이틀, ML 사용자 태그 등.
