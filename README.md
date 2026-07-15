# 📖 책갈피 — 서평 사이트

책을 읽고 어디까지 읽었는지 기록하고, 별점·서평·인상깊은 글귀를 남기고,
읽은 책으로 토론을 열고, 취향에 맞는 책을 추천받는 웹사이트.

## 🌐 배포 (Live)

- 프론트엔드: https://book-review-frontend-ov6h.onrender.com
- 백엔드 API: https://book-review-api-xsmv.onrender.com
- 데모 계정: `reader` / `password` (또는 `bookworm` / `password`)

> 무료 플랜이라 백엔드가 잠들어 있으면 첫 접속에 ~30초 콜드스타트가 있을 수 있어요.

## 🛠 기술 스택

- **프론트엔드**: React + Vite + React Router (`frontend/`)
- **백엔드**: Express + TypeScript, Prisma ORM (`server/`)
- **DB**: PostgreSQL
- **외부 API**: 알라딘 OpenAPI (책 검색·표지·베스트셀러)
- **배포**: Render (Blueprint: `render.yaml`)

## 📁 구조

```
book_review/
├─ server/                # 백엔드
│  ├─ prisma/             # 스키마 · 시드 (소스와 분리)
│  └─ src/                # 소스 코드
│     ├─ controller/      # 요청/응답
│     ├─ service/         # 비즈니스 로직
│     ├─ repository/      # DB 접근 (Prisma)
│     ├─ recommendation/  # 추천 로직 (콘텐츠기반·인기·연령대)
│     ├─ middleware/      # 인증
│     └─ lib/             # Prisma 클라이언트, 쿠키 설정
├─ frontend/              # 프론트엔드
│  └─ src/{page, component, api, lib}
├─ docs/                  # 요구사항·설계·배포 문서
│  ├─ design/             # UI 요청 기록
│  ├─ logic/              # 백엔드 요청 기록
│  ├─ deploy.md           # 배포 가이드
│  └─ todo.md             # 미구현/향후 작업
├─ render.yaml            # Render 배포 블루프린트
└─ docker-compose.yml     # 로컬 Postgres
```

### 네이밍 컨벤션
- 폴더: `snake_case` + 단수형 (`controller`, `service`, `repository`)
- 파일: `snake_case` (`auth_controller.ts`)
- 함수: `camelCase` (React 컴포넌트만 PascalCase)

## ✨ 주요 기능

- **계정**: 회원가입(아바타·출생연도 선택) / 로그인 / 로그아웃 / 내 정보 수정(비밀번호 변경·회원 탈퇴)
- **독서 기록·서평**: 몇 페이지부터 몇 페이지까지 + 별점 + 서평 + 인상깊은 글귀(선택), 날짜별 이력
- **좋아요 / 댓글**: 서평·토론에 좋아요와 댓글
- **관심 책**: 관심 책 지정(관심 책은 갈색으로 강조)
- **토론**: 읽었거나 읽는 중인 책만 개설, 누구나 댓글 참여
- **알림 🔔**: 내 토론에 댓글 / 내 서평에 좋아요·댓글 시 알림, 클릭 시 이동
- **마이페이지**: 독서 달력 + 내 서평/내 책/내 토론
- **추천하는 책** (필터로 선택):
  - 읽은 책과 비슷한 책 (콘텐츠 기반: 장르·카테고리·작가 유사도 + 별점·최근성 가중)
  - 요즘 많이 사는 책 (알라딘 베스트셀러, 주제 필터 / 연령대별 우리 플랫폼 인기)
- **책 검색·추가**: 알라딘에서 검색해 실제 표지와 함께 추가
- **캐러셀**: 서평·토론·추천을 가로로 넘겨보기(‹ ›), 끝에서 계속 더 불러오기

## 🚀 로컬 실행

Prisma가 PostgreSQL을 사용하므로 로컬에도 Postgres가 필요합니다.

```bash
# 1) 로컬 Postgres 기동 (Docker)
docker compose up -d

# 2) 백엔드
cd server
npm install
cp .env.example .env          # DATABASE_URL, ALADIN_TTB_KEY 설정
npm run db:push               # 스키마 반영
npm run seed                  # 초기 데이터
npm run dev                   # http://localhost:4000

# 3) 프론트엔드 (새 터미널)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

`ALADIN_TTB_KEY`는 https://www.aladin.co.kr/ttb/apiguide.aspx 에서 발급.
Docker가 없으면 `.env`의 `DATABASE_URL`을 원격 Postgres 주소로 지정해도 됩니다.

## ☁️ 배포

Render Blueprint(`render.yaml`)로 백엔드 + 프론트 + Postgres를 한 번에 생성합니다.
자세한 절차는 [`docs/deploy.md`](docs/deploy.md) 참고.

## 📌 향후 계획

`docs/todo.md` 참고 — 협업 필터링 추천, 책 컬렉션 타이틀, ML 사용자 태그 등.
