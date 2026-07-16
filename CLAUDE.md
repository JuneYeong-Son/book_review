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

## 배포 (필수)

배포는 **Render Blueprint**(`render.yaml`)로 관리된다: 백엔드 `book-review-api` + 프론트 `book-review-frontend` + Postgres. GitHub 원격 `JuneYeong-Son/book_review`의 **`main`에 push하면 Render가 자동 재배포**한다.

- **Live URL**
  - 프론트: https://book-review-frontend-ov6h.onrender.com
  - 백엔드 API: https://book-review-api-xsmv.onrender.com
- **세션 시작 시:** `git fetch` 후 `git status -sb`로 **로컬이 `origin/main`(=현재 배포본) 대비 어떤 상태인지** 확인해, 배포가 최신인지·안 올라간 변경이 있는지 파악한다.
- **커밋 후:** 변경을 배포 사이트에 반영하려면 반드시 **`git push origin main`** 한다(그래야 Render가 재배포). 커밋만 하고 push를 빠뜨려 배포가 뒤처지지 않게 한다.
- 무료 플랜이라 백엔드가 잠들어 있으면 첫 접속에 ~30초 콜드스타트가 있을 수 있다.
- 배포 세부 절차는 [docs/deploy.md](docs/deploy.md), 요약은 [README.md](README.md) "배포" 참고.
