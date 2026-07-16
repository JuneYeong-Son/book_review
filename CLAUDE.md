# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude(및 에이전트)에게 항상 적용되는 규칙입니다.

## 커밋 메시지 컨벤션 (필수)

모든 커밋 메시지는 **대괄호 타입 태그**로 시작하고, 그 뒤에 한국어로 변경 내용을 적는다.

- `[feature]` — 새 기능 추가 (예: `[feature] 별점 필터 기능 추가`)
- `[fix]` — 버그 수정 / 잘못된 동작 교정 (예: `[fix] 로그인 토큰 만료 오류 수정`)
- `[chore]` — 파일명 변경, 설정, 배포, 데이터 등 잡일 (예: `[chore] tsconfig 파일명 정리`)
- `[docs]` — 문서 (예: `[docs] README 업데이트`)

필요하면 같은 대괄호 스타일로 `[refactor]`, `[style]`, `[test]` 등을 확장해서 쓴다.
콜론 스타일(`feat:`/`fix:`)이 아니라 **대괄호 + 전체 단어(`[feature]`)** 를 쓴다.

## 작업 기록 (필수)

사용자가 지시한 작업을 수행하면, 그 작업을 [docs/작업로그.md](docs/작업로그.md)에 기록한다. 세션이 바뀌어도 이어서 기록한다.

- **언제:** 사용자가 시킨 작업을 끝냈을 때(또는 의미 있는 단위로 마무리했을 때).
- **어디에:** `docs/작업로그.md`의 **맨 위**에 새 항목을 추가한다(최신이 위, 역순).
- **무엇을:** 날짜(`YYYY-MM-DD`) · 사용자가 지시한 내용 요약 · 한 일(변경한 파일/핵심) · 관련 커밋. 제외하거나 보류한 게 있으면 사유도 남긴다.
- 단순 질문 답변이나 사소한 확인은 기록하지 않는다. **실제로 코드/문서/설정을 바꾸는 작업**만 남긴다.

### 주제별 문서에도 반영 (필수)

작업로그(연대기)에 더해, **변경의 성격에 맞는 주제 문서도 함께 갱신**한다. 알맞은 파일이 있으면 찾아서 고치고, 없으면 해당 폴더에 새로 만든다.

- **백엔드 로직 / 데이터 / API가 바뀌면** → `docs/logic/` 의 알맞은 파일을 갱신하거나 새 주제 파일을 만든다. 기본은 [docs/logic/backend-requests.md](docs/logic/backend-requests.md).
- **프론트엔드 설계 철학 / 시각 언어가 바뀌면** → `docs/design/` 쪽을 갱신한다.
  - 시각 시스템·디자인 철학(색·폰트·질감·톤): [docs/design.md](docs/design.md)
  - 화면·UI 요청 사항: [docs/design/ui-requests.md](docs/design/ui-requests.md)
  - 폴더·아키텍처 구조: [docs/design/frontend_structure.md](docs/design/frontend_structure.md)
- 데이터 모델·전체 개요가 바뀌면 [docs/requirements.md](docs/requirements.md), 배포 절차면 [docs/deploy.md](docs/deploy.md).
- 어디에 넣을지 애매하면 가장 가까운 기존 문서를 고르고, 정말 새 주제일 때만 해당 폴더(`logic/` 또는 `design/`)에 파일을 새로 만든다. 작업로그에는 **어느 주제 문서를 갱신했는지**도 함께 남긴다.

## 배포 (필수)

배포는 **Render Blueprint**(`render.yaml`)로 관리된다: 백엔드 `book-review-api` + 프론트 `book-review-frontend` + Postgres. GitHub 원격 `JuneYeong-Son/book_review`의 **`main`에 push하면 Render가 자동 재배포**한다.

- **Live URL**
  - 프론트: https://book-review-frontend-ov6h.onrender.com
  - 백엔드 API: https://book-review-api-xsmv.onrender.com
- **세션 시작 시:** `git fetch` 후 `git status -sb`로 **로컬이 `origin/main`(=현재 배포본) 대비 어떤 상태인지** 확인해, 배포가 최신인지·안 올라간 변경이 있는지 파악한다.
- **커밋 후:** 변경을 배포 사이트에 반영하려면 반드시 **`git push origin main`** 한다(그래야 Render가 재배포). 커밋만 하고 push를 빠뜨려 배포가 뒤처지지 않게 한다.
- 무료 플랜이라 백엔드가 잠들어 있으면 첫 접속에 ~30초 콜드스타트가 있을 수 있다.
- 배포 세부 절차는 [docs/deploy.md](docs/deploy.md), 요약은 [README.md](README.md) "배포" 참고.

## 프론트엔드 작업 규칙 — Vercel 스킬 필수 참고 (모든 세션)

프론트엔드(`frontend/`, React + Vite) 코드를 **작성·리뷰·리팩터**하거나 **UI/UX·CSS·접근성**을 다룰 때는, 아래 3개 스킬(`vercel-labs/agent-skills`)을 **참고·적용**한다. 관련 작업을 시작하기 전에 해당 스킬을 **Skill 도구로 불러** 그 지침대로 진행한다. 이 규칙은 이 저장소의 **모든 세션**에 적용된다.

- **`vercel-react-best-practices`** — React/Next 성능, 데이터 패칭, 번들 최적화. 컴포넌트를 새로 쓰거나 리팩터·리뷰할 때.
- **`vercel-composition-patterns`** — 컴포넌트 합성(compound·render props·context) 설계. boolean prop 남발을 정리하거나 재사용 API를 설계할 때.
- **`web-design-guidelines`** — Web Interface Guidelines(접근성·UX) 준수 리뷰. UI 리뷰·접근성 점검·디자인 감사를 할 때.

> 디자인 토큰·시각 규칙은 [docs/design.md](docs/design.md)를 따르고(§ "종이 위에 쓴 느낌"), 위 스킬은 그 위에서 구현 품질(성능·합성·접근성)을 보강하는 용도로 쓴다. 문서 편집·백엔드 전용 작업 등 프론트와 무관한 작업엔 강제하지 않는다.
