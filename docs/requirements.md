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
- `User(id, username, name, passwordHash)`
- `Book(id, title, author, cover)`
- `Progress(id, userId, bookId, page, note, rating, updatedAt)` — 유저×책 1개(upsert)
- `Interest(id, userId, bookId)` — 관심 책
- `Discussion(id, bookId, ownerId, title, description)`
- `Comment(id, discussionId, userId, text)`

## 6. 기타 메모
- 기존 홈 디렉토리(`C:/Users/손`) 전체가 팀 저장소(`proteiin/nb04-seven-team1`)에 연결된
  git 저장소였음. `book_review`는 **독립 git 저장소**로 새로 만들어
  `https://github.com/JuneYeong-Son/book_review.git` 에 연결한다.
- 시드 계정: `reader` / 비밀번호 `password`
