# 📖 책갈피 — 서평 사이트

책을 읽고 어디까지 읽었는지 기록하고, 별점과 서평을 남기고, 읽은 책으로 토론을 여는 웹사이트.

## 구조

```
book_review/
├─ server/            # 백엔드 (Express + TypeScript + Prisma + SQLite)
│  ├─ prisma/         # DB 스키마 · 마이그레이션 · 시드 (소스와 분리)
│  └─ src/            # 소스 코드
│     ├─ controller/  # 요청/응답 처리
│     ├─ service/     # 비즈니스 로직
│     ├─ repository/  # DB 접근 (Prisma)
│     ├─ middleware/  # 인증 미들웨어
│     └─ lib/         # Prisma 클라이언트
├─ frontend/          # 프론트엔드 (React + Vite)
│  └─ src/{page, component, api, lib}
└─ docs/              # 요구사항 기록
```

### 네이밍 컨벤션
- 폴더: `snake_case` + 단수형 (`controller`, `service`, `repository`)
- 파일: `snake_case` (`auth_controller.ts`)
- 함수: `camelCase` (React 컴포넌트만 PascalCase)

## 주요 기능
- 로그인 / 로그아웃 / 회원가입
- 독서 기록 (오늘 무슨 책을 어디까지) — 모두가 열람 가능
- 서평 + 별점(0~5)
- 관심 책 지정
- 토론: 읽었거나 읽는 중인 책만 개설 가능, 누구나 댓글 참여

## 실행 방법

### 1) 백엔드
```bash
cd server
npm install
cp .env.example .env          # DATABASE_URL 설정
npx prisma migrate dev        # DB 생성 + 마이그레이션
npm run seed                  # 초기 데이터 (계정 reader / password)
npm run dev                   # http://localhost:4000
```

### 2) 프론트엔드
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

브라우저에서 http://localhost:5173 접속. (`/api` 요청은 Vite 프록시로 백엔드에 전달)

## 향후 계획
`docs/requirements.md` 참고 — 책 컬렉션 타이틀, 추천 시스템, ML 기반 사용자 태그 등.
