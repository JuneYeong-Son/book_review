# 📖 책갈피 — 서평 사이트

책을 읽고 어디까지 읽었는지 기록하고, 서평·별점·인상깊은 글귀를 남기고,
읽은 책으로 토론을 열고, 취향에 맞는 책을 추천받는 웹사이트. **안드로이드 앱**(Capacitor)도 제공.

## 🔄 다시 시작할 때 (Onboarding)

나중에 이 프로젝트를 다시 열었을 때 빠르게 기억하기 위한 요약.

- **먼저 읽기**: 이 README → 아래 "주요 기능" → 세부는 `docs/`.
  - **UI 요청** = `docs/design/ui-requests.md`, **백엔드 요청** = `docs/logic/backend-requests.md`
  - **데이터 모델/개요** = `docs/progress/requirements.md`, **남은 일** = `docs/progress/todo.md`, **작업 로그** = `docs/progress/작업로그.md`
  - **배포** = `docs/logic/deploy.md`, **보안 감사·조치** = `docs/security/`, **안드로이드 앱·스토어** = `docs/android/`
- **바로 실행**: 아래 "로컬 실행"대로 `server`·`frontend`에서 `npm install` → `npm run dev`. 로컬은 SQLite라 DB 설치 불필요.
- **꼭 기억할 것(gotcha)**:
  - 로컬은 **SQLite**(`server/prisma/dev.db`), 배포는 **PostgreSQL**. 빌드 때 `scripts/use-postgres.mjs`가 자동 전환하니 **`schema.prisma`의 provider는 `sqlite`로 두기**.
  - `server/.env` 키: `ALADIN_TTB_KEY`(알라딘), `RESEND_API_KEY`(이메일 인증), `KAKAO_REST_API_KEY`·`GOOGLE_CLIENT_ID/SECRET`(소셜 로그인). 없으면 해당 기능만 비활성.
  - GitHub 원격은 `JuneYeong-Son/book_review`. (이 PC엔 자격증명이 저장돼 있어 push 가능)
  - **관리자 지정**: env `ADMIN_USERNAMES`(쉼표구분, **기본값 없음**). `ADMIN_PASSWORD` 설정 시 부팅마다 그 비번으로 재설정. (보안 감사로 과거 기본 `reader` 제거)
  - **이메일 인증**: `EMAIL_VERIFICATION=off` 면 코드 단계 생략(도메인 없을 때). 없으면 인증 필수.

## 🌐 배포 (Live)

- 프론트엔드: https://book-review-frontend-ov6h.onrender.com
- 백엔드 API: https://book-review-api-xsmv.onrender.com
- 이용 약관: `/terms` · 개인정보 처리방침: `/privacy`

> 무료 플랜이라 백엔드가 잠들어 있으면 첫 접속에 ~30초 콜드스타트가 있을 수 있어요.
> (데모 계정은 로컬 개발에서만 비번 `password`. 프로덕션 시드는 랜덤 비번 — 보안 감사 반영.)

## 🛠 기술 스택

- **프론트엔드**: React + Vite + React Router, **SWR**(데이터 패칭·dedup·캐시) (`frontend/`)
- **백엔드**: Express + TypeScript, Prisma ORM (`server/`, tsx로 실행)
- **DB**: 로컬 **SQLite** / 배포 **PostgreSQL** (빌드 시 자동 전환 — `scripts/use-postgres.mjs`)
- **인증**: 쿠키 서명 세션(웹) + **토큰(Bearer, 앱)**. 이메일 인증 회원가입(Resend), **소셜 로그인(카카오·구글 OAuth)**.
- **외부 API/서비스**: 알라딘 OpenAPI(책·베스트셀러), Resend(메일), Kakao/Google(로그인)
- **모바일**: **Capacitor** 안드로이드 앱(번들 + 토큰 인증) — `frontend/android/`, 가이드 `docs/android/`
- **디자인**: "종이 위에 쓴 느낌" — 종이 질감 + **을유1945** 폰트(self-host). 규칙은 `docs/design/design.md`
- **배포**: Render (Blueprint: `render.yaml`)

## 📁 구조

```
book_review/
├─ server/                # 백엔드
│  ├─ prisma/             # 스키마 · 시드 (소스와 분리)
│  ├─ scripts/            # 배포용 provider 전환 스크립트
│  └─ src/
│     ├─ controller/      # 요청/응답 (auth·book·progress·discussion·notification·report·admin·user·feedback)
│     ├─ service/         # 비즈니스 로직 (auth·oauth·email·book·progress·discussion·… )
│     ├─ repository/      # DB 접근 (Prisma)
│     ├─ recommendation/  # 추천 로직 (content·item_cf·popularity·age_group·exclusions)
│     ├─ middleware/      # 인증(쿠키·토큰) · 관리자
│     └─ lib/             # Prisma·쿠키·토큰·부트스트랩
├─ frontend/              # 프론트엔드
│  ├─ src/{pages, widgets, entities, features, shared, app}
│  ├─ capacitor.config.ts # 안드로이드 앱 설정
│  └─ android/            # Capacitor 네이티브 프로젝트
├─ docs/                  # design/ · logic/ · progress/ · security/ · android/
├─ render.yaml            # Render 배포 블루프린트
└─ docker-compose.yml     # (선택) 로컬 Postgres
```

### 네이밍 컨벤션
- 폴더: `snake_case` + 단수형 (`controller`, `service`, `repository`)
- 파일: `snake_case` (`auth_controller.ts`) · 함수: `camelCase` (React 컴포넌트만 PascalCase)

## ✨ 주요 기능

- **계정/인증**: 회원가입(아이디·이메일·이름·닉네임·휴대폰·개인정보 동의) → **이메일 인증**(Resend, `off`면 생략) / **소셜 로그인(카카오·구글)** / 로그인·로그아웃 / 내 정보 수정(닉네임·아바타·비밀번호·회원 탈퇴). 비밀번호 정책(8자+영문·숫자).
- **닉네임(활동 표시명)**: 실시간 중복 확인. 서평·토론·댓글·프로필 등 표시명은 닉네임(없으면 이름).
- **독서 기록·서평**: 몇 쪽~몇 쪽 + 서평 + 인상깊은 글귀(선택), 날짜별 이력. 본인 서평 수정/삭제. URL `/books/{책}/reviews/{순번}`. 과하게 짧은 글 방지.
- **책 단위 별점 / 좋아요 / 댓글 / 관심 책(내 서재)**: 서평은 **서재에 담은 책만** 작성.
- **토론**: 읽은 책만 개설, 누구나 댓글. 책 소개와 본문 시각 분리.
- **알림 🔔**: 내 토론 댓글 / 내 서평 좋아요·댓글.
- **유저 프로필**: 작성자·책 클릭 → 상세로 이동.
- **피드백/신고/관리자**: 푸터 '의견·버그 신고'. 관리자(`/admin`) 대시보드 + **회원 관리(권한·활동 정지·삭제)** + 피드백 조회 + 신고 게시물 삭제.
- **마이페이지**: 독서 달력 + 탭(내 서평/서재/글귀/토론).
- **추천하는 책**: 협업 필터링(CF)+콘텐츠 / 알라딘 베스트셀러(주제 필터·무한 로드) / 추천 제외(X).
- **안드로이드 앱**: Capacitor 번들 앱(토큰 인증). 앱에선 아이디 로그인 사용(소셜은 향후).

## 🚀 로컬 실행

로컬은 **SQLite**를 사용해 별도 DB 설치가 필요 없습니다.

```bash
# 1) 백엔드
cd server
npm install
cp .env.example .env          # DATABASE_URL="file:./dev.db", ALADIN_TTB_KEY 등
npm run db:push               # 스키마 반영 (dev.db 생성)
npm run seed                  # 예시 데이터 (로컬은 데모 계정 비번 password)
npm run dev                   # http://localhost:4000

# 2) 프론트엔드 (새 터미널)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

`ALADIN_TTB_KEY`는 https://www.aladin.co.kr/ttb/apiguide.aspx 에서 발급.

## 📱 안드로이드 앱

```bash
cd frontend
npm run build && npx cap sync android
npm run android:open          # Android Studio에서 빌드/실행
```
자세한 빌드·스토어 심사 준비는 [`docs/android/`](docs/android/) 참고.

## ☁️ 배포

Render Blueprint(`render.yaml`)로 백엔드 + 프론트 + Postgres를 한 번에 생성. 빌드 시 provider가 postgresql로 자동 전환됩니다.
운영 환경변수(관리자·이메일·소셜·이메일 인증 토글)는 [`docs/security/README.md`](docs/security/README.md)의 표 참고. 절차는 [`docs/logic/deploy.md`](docs/logic/deploy.md).

## 📌 향후 계획

`docs/progress/todo.md` 참고 — 공지사항, 앱 소셜 로그인(딥링크), iOS 앱, 추천 고도화 등.
