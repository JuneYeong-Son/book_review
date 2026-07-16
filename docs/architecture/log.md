# 아키텍처 변경 로그

> 리팩터·구조 변경 이력. 최신이 위. (설계 리뷰는 [solid-review-*.md](solid-review-2026-07-17.md), DB는 [../database/](../database/).)

---

## 2026-07-17 — `simplify` 스킬 적용 (커밋 `83de266`)

`simplify` 스킬로 오늘 세션 변경분(`a549b50..HEAD`)을 **4개 관점(재사용·단순화·효율·추상화) 병렬 리뷰** → 겹치는 것 정리 후 **행동 불변**을 지키며 아래를 적용. 타입체크 + 스모크(OAuth 302·토큰 로그인·`/me`·피드백) 통과.

### 적용한 변경
| # | 파일 | 변경 | 관점 |
|---|------|------|------|
| 1 | `server/src/service/oauth_service.ts` | 카카오·구글의 **토큰교환·프로필조회 중복(~35줄)** 을 `exchangeCodeForToken` / `fetchProfileJson` 공통 헬퍼로 추출. authorize URL·프로필 파싱은 제공자별로 유지(형태가 실제로 다름). | 재사용·단순화 |
| 2 | `server/src/controller/auth_controller.ts` | OAuth 라우트 **4개(kakao/google × authorize/callback) → 제공자 레지스트리(`OAUTH_PROVIDERS`) + 루프**. 새 소셜은 레지스트리에 한 줄 추가하면 라우트 자동 생성. | 추상화·단순화 |
| 3 | `server/src/service/auth_service.ts` + `auth_controller.ts` | `getUser(id, preloaded?)` — `requireAuth`가 이미 조회해 `res.locals.user`에 둔 유저를 **재사용** → 핫패스 `/me`의 **중복 `findUserById` 제거**. | 효율 |
| 4 | `server/src/lib/rate_limit.ts`(신규) | `makeRateLimiter(windowMs, max)` 팩토리 — auth/check/feedback 3곳의 동일 보일러플레이트(표준헤더·한글 메시지) 통합. | 재사용 |
| 5 | `server/src/lib/token.ts` + `auth_middleware.ts` + `feedback_controller.ts` | `resolveUserId(req)`(쿠키 또는 Bearer 토큰) 헬퍼로 통합. requireAuth·피드백이 공유 → **앱(토큰) 사용자 피드백도 익명이 아닌 작성자로 기록**(부수 개선). | 추상화 |
| 6 | `server/src/service/progress_service.ts` | 서평 최소길이 검증 중복(saveProgress·editReview)을 `noteTooShortError()`로 통합. | 재사용 |
| 7 | `frontend/src/shared/api/client.ts` | `NATIVE`·`API_BASE`를 **export** → auth_context·login_page가 재정의 대신 재사용(중복 `Capacitor.isNativePlatform()`/`VITE_API_URL` 제거). | 재사용 |
| 8 | `frontend/src/shared/lib/auth_context.tsx` | 로그인/가입 성공 시 `토큰저장→캐시클리어→setUser` 3단계 중복(3곳)을 `applyAuth()` 헬퍼로 통합. | 단순화 |
| 9 | `frontend/src/pages/register_page.tsx` | `setDevCode(r.dev ? r.devCode ?? null : null)` → `setDevCode(r.devCode ?? null)`(서버가 dev 모드에서만 devCode를 채우므로 `r.dev` 가드는 죽은 분기). | 단순화 |

### 의도적으로 보류(과설계/이득 대비 처칠 큼)
- cold-path 서비스(changePassword·deleteAccount·updateProfile)의 `res.locals.user` 재사용 — 시그니처 변경 대비 이득 적음.
- 2개뿐인 provider를 완전 config-driven 엔진으로 통합 — authorize 파라미터·응답 형태가 달라 오히려 길고 불투명(YAGNI).
- 범용 `sendResult` 응답 헬퍼 — 성공 응답 형태(쿠키/토큰/상태코드)가 핸들러마다 제각각.
- 토큰 vs 쿠키 분기 위치는 **현행 유지가 정답**(미들웨어 단일 지점에서 둘 다 수용, 서버는 클라 종류에 무관) — 건드리지 않음.
