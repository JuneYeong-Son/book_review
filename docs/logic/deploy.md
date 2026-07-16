# 배포 가이드 (Render + PostgreSQL)

프론트(정적) + 백엔드(API) + Postgres 를 **Render 한 곳**에 배포한다.
`render.yaml` 블루프린트로 세 리소스를 한 번에 생성한다.

## 사전 준비 (네가 할 일)
1. https://render.com 가입 (GitHub 계정으로 로그인 권장).
2. GitHub 저장소 `JuneYeong-Son/book_review` 가 최신인지 확인 (이미 푸시됨).
3. 알라딘 TTB 키 준비 (`ttbsonj04070213001`).

## 1) 블루프린트로 생성
1. Render 대시보드 → **New +** → **Blueprint**.
2. 이 저장소(`book_review`) 선택 → Render가 `render.yaml`을 읽어 3개 리소스를 제안:
   - `book-review-db` (Postgres)
   - `book-review-api` (백엔드)
   - `book-review-frontend` (정적 프론트)
3. **Apply** → 생성 시작. (백엔드 build에서 `prisma db push`로 테이블 생성 + 시드)

## 2) 환경변수 채우기 (배포 후 1회)
서비스 주소가 정해지면 아래를 채우고 각 서비스를 **Manual Deploy → Deploy latest**:

- **book-review-api** 환경변수:
  - `ALADIN_TTB_KEY` = 발급받은 키
  - `FRONTEND_URL` = 프론트 주소 (예: `https://book-review-frontend.onrender.com`)
- **book-review-frontend** 환경변수:
  - `VITE_API_URL` = 백엔드 주소 (예: `https://book-review-api.onrender.com`)
  - ※ 프론트는 정적 빌드라 이 값을 바꾸면 **재배포(재빌드)** 필요.

## 3) 확인
- 백엔드: `https://book-review-api.onrender.com/api/books` → JSON 응답.
- 프론트: `https://book-review-frontend.onrender.com` 접속 → 로그인(reader/password).

## 주의 / 팁
- **무료 플랜**: 백엔드가 15분 미사용 시 잠들고, 첫 요청에 ~30초 콜드스타트.
- **쿠키 인증**: production에서 `SameSite=None; Secure`로 동작(코드에 반영). 프론트·백엔드가
  https여야 로그인 쿠키가 유지됨 (Render는 https 기본).
- **재배포 시 데이터 보존**: 시드는 `SEED_SKIP_IF_DATA=1`이라 데이터가 있으면 건너뜀.
- **DB 초기화하려면**: Render Postgres를 비우거나, api 서비스 Shell에서 `npm run seed` (주의: 기존 데이터 삭제).

## 로컬 개발 (배포와 동일한 Postgres로)
Prisma provider가 `postgresql`이라 로컬도 Postgres가 필요하다.
```bash
docker compose up -d              # 로컬 Postgres 기동
# server/.env 의 DATABASE_URL 을 .env.example 값으로 설정
cd server && npm install && npm run db:push && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```
Docker가 없으면 Render Postgres의 External URL을 `server/.env`의 DATABASE_URL로 써도 된다.
