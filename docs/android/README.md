# 안드로이드 앱

책갈피 웹앱(React+Vite)을 **Capacitor**로 감싼 안드로이드 앱 관련 문서.

- [build.md](build.md) — 빌드/실행 방법(번들·토큰 인증 구조 포함)
- [store-submission.md](store-submission.md) — **Google Play 스토어 심사 체크리스트**(나중에 볼 것)

## 한눈에
- 방식: Capacitor **번들 + 토큰(Bearer) 인증** (순수 웹뷰 래퍼 아님).
- 프로젝트: `frontend/android/` · 설정: `frontend/capacitor.config.ts`.
- APK/AAB 빌드는 **Android Studio(JDK17+SDK)** 필요 — 이 저장소엔 스캐폴드까지.
- 앱에선 소셜 로그인 미지원(아이디 로그인 사용), 딥링크는 향후 과제.
