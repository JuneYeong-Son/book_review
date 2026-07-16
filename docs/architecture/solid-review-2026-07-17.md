# SOLID 원칙 점검 (2026-07-17)

> 백엔드(controller→service→repository) + 프론트(FSD)의 SOLID 준수 여부 리뷰. 근거: 실제 파일 구조·크기·의존성.

## 총평
전반적으로 규모에 맞게 **잘 지켜지고 있음.** 3계층 분리로 SRP를, 추천 전략 디스패치로 OCP를 자연스럽게 충족. 딱 한 곳(`auth_service`)에 SRP 냄새.

## 원칙별

### S — 단일 책임 ✅ (1곳 주의)
- **좋음:** 컨트롤러(HTTP)·서비스(로직)·리포지토리(Prisma) 분리. 프론트도 `client.ts`(전송)·`auth_context`(인증상태)·`displayName`/`useAvailability`(추출) 등 책임 분할.
- **⚠️ 냄새:** `server/src/service/auth_service.ts`(≈223줄·10 export) — 비밀번호 정책·중복확인·로그인·2단계 가입·프로필·비번변경·탈퇴가 한 파일.
  - **권장 분리:** `auth_service`(login·getUser) / `registration_service`(check*·start·verify) / `account_service`(updateProfile·changePassword·deleteAccount) / `password.ts`(validatePassword).
  - ✅ **해결됨(2026-07-17):** 위 대로 분리 완료 + `public_user.ts`(toPublicUser) 추출. [log.md](log.md) 참고.

### O — 개방/폐쇄 ✅
- 모범: `server/src/recommendation/index.ts`가 method로 전략(content/cf/popular/ageGroup) 디스패치 → 새 방식 추가 시 기존 미수정.
- 소셜 로그인 `resolveSocialUser` 공통화로 구글 확장이 대체로 OCP.

### L — 리스코프 치환 ✅ (해당 적음)
- 상속 거의 없음. 결과를 판별 유니온(`{error}|{user}`)으로 표현 — 타입 안전. 위반 없음.

### I — 인터페이스 분리 ✅
- 비대 인터페이스 없음. `toPublicUser`가 노출 필드 축소(정보 은닉), 리포지토리 `select`로 필요한 컬럼만.

### D — 의존성 역전 ⚠️ (의도된 트레이드오프)
- 서비스가 리포지토리 함수를 직접 import(인터페이스 주입 아님). 다만 리포지토리가 Prisma를 감싸 DB 의존을 격리 → 이 규모엔 적절. 인터페이스+DI는 과설계(YAGNI).

## 결론 / 권장
- 실질적으로 SOLID를 충족(계층화·전략 디스패치·판별 유니온·정보 은닉).
- **유일하게 손볼 값:** `auth_service` 분리(SRP). → 백로그 [../progress/todo.md](../progress/todo.md).
- 나머지는 더 나누면 과설계. **스토어 빌드 우선**, 분리는 이후 권장.
