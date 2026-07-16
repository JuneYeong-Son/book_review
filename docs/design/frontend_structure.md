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
