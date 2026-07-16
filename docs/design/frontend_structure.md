# 프론트엔드 폴더 구조 — Feature-Sliced Design (FSD)

`frontend/src`는 [Feature-Sliced Design](https://feature-sliced.design/)의 **실용형**으로 구성한다.
경로는 `@/` 별칭(= `src/`)을 쓴다. (`tsconfig.json`의 `paths`, `vite.config.ts`의 `resolve.alias`)

## 레이어 (위 → 아래)

```
src/
  app/        앱 진입·전역 설정. App.tsx(라우팅), styles/index.css
  pages/      라우트 단위 화면. *_page.tsx
  widgets/    여러 곳에서 쓰는 합성 UI 블록. nav_bar, app_footer, reading_calendar, carousel, quick_actions
  features/   사용자 행동 단위 기능. report_button, book_import_panel
  entities/   도메인 표시 단위. book_card, star_rating
  shared/     어디서나 쓰는 공용. api(client·types), ui(modal), lib(auth_context)
  main.tsx    번들 엔트리
```

## 의존 방향 규칙 (중요)

**위 레이어만 아래 레이어를 import 한다.** 반대는 금지.

`app → pages → widgets → features → entities → shared`

- 예) `pages`는 `widgets/features/entities/shared`를 import 가능.
- 예) `shared`는 어떤 상위 레이어도 import 하지 않는다(가장 아래, 재사용 기반).
- 같은 레이어끼리의 import는 지양한다(실용형에서 최소한만 허용).

## 새 파일 놓을 위치 고르기

- 특정 라우트 화면 → `pages/`
- 여러 페이지가 재사용하는 큰 UI 덩어리 → `widgets/`
- "무엇을 한다"(신고·검색·좋아요 등) 행동 기능 → `features/`
- 책·유저·별점 등 도메인 데이터를 그리는 조각 → `entities/`
- 도메인 무관 공용(HTTP 클라이언트, 타입, 기본 UI, 훅) → `shared/`

> 더 엄격한 정석 FSD(슬라이스별 `ui/model/api` 세그먼트 + `index.ts` public API)는 지금은 도입하지 않았다.
> 규모가 커지면 슬라이스 단위로 승격한다.

## 데이터 패칭 — SWR (필수 패턴)

서버 데이터 조회(GET)는 **SWR**로 한다. 전역 설정은 [main.tsx](../../frontend/src/main.tsx)의 `<SWRConfig>`(공용 `swrFetcher` + `revalidateOnFocus:false` + `dedupingInterval`), fetcher는 [shared/api/client.ts](../../frontend/src/shared/api/client.ts)의 `swrFetcher`.

- **공유 데이터는 공용 훅으로.** 여러 화면이 같은 엔드포인트를 쓰면 [shared/api/hooks.ts](../../frontend/src/shared/api/hooks.ts)의 훅(`useMyProgress`·`useMyInterests`·`useMyDiscussions`·`useBooks`)을 쓴다. 같은 SWR 키(`KEY.*`)를 공유하면 SWR이 요청을 자동 dedup하고 캐시를 나눠 쓴다. (홈·QuickActions·마이페이지가 `/progress/me`·`/books/interests/me`를 중복 호출하던 문제를 이렇게 없앴다.)
- **로그인 범위 데이터는 key를 게이팅.** 비로그인 시 `useSWR(user ? KEY.x : null)`로 키를 `null`로 두어 요청하지 않는다.
- **쓰기(작성·삭제·토글) 후에는 재검증.** `import { mutate } from 'swr'` 로 바뀐 키를 `mutate(KEY.progressMe)`처럼 무효화한다. 수동 `apiGet`+`setState` 재조회를 새로 만들지 않는다.
- **무한 스크롤/페이지네이션 목록**(서평·토론·추천 캐러셀)은 아직 수동 `apiGet` + 로컬 state를 쓴다. 필요 시 `useSWRInfinite`로 승격은 후속 과제.
- 새 GET을 추가할 때: 한 화면 전용이면 그 자리에서 `useSWR('/path')`, 여러 화면 공유면 `hooks.ts`에 훅과 `KEY`를 추가한다.
