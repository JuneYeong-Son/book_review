# 안드로이드 앱 (Capacitor)

책갈피 웹앱(React+Vite)을 **Capacitor**로 감싼 네이티브 안드로이드 앱.

## 방식 (v1 — 원격 URL 래핑)
- 앱이 배포된 사이트(`https://book-review-frontend-ov6h.onrender.com`)를 네이티브 WebView로 로드.
- **장점:** 소셜 로그인(카카오/구글)·쿠키 세션·이메일 인증이 웹과 100% 동일하게 작동(백엔드 변경 0). 사이트를 배포하면 앱도 자동 최신.
- **단점:** 인터넷 필요. 순수 WebView 래핑이라 Google Play 심사는 별도 고려 필요(개인 설치/사이드로드는 문제없음).
- 설정: [../../frontend/capacitor.config.ts](../../frontend/capacitor.config.ts) — `appId: com.bookreview.app`, `appName: 책갈피`, `server.url`.

> 나중에 dist를 앱에 **번들**(오프라인/스토어용)하려면: capacitor.config.ts의 `server` 블록 제거 → `npm run cap:sync`. 단, 번들 시 OAuth 리다이렉트/교차출처 쿠키 추가 설정 필요(딥링크 등).

## 빌드 준비물 (이 저장소엔 안 깔림 — 각자 PC에)
1. **JDK 17** (Android Gradle Plugin 8 요구)
2. **Android Studio** (SDK + 플랫폼 + 빌드도구 포함) — https://developer.android.com/studio
3. 최초 실행 시 Android Studio가 SDK를 설치하도록 둔다.

## 빌드 / 실행
```bash
cd frontend
npm install                 # capacitor 포함 의존성
npm run build               # dist 생성 (webDir)
npx cap sync android        # 네이티브 프로젝트에 설정 반영
npm run android:open        # Android Studio로 android/ 열기
```
- Android Studio에서 기기(USB 디버깅) 또는 에뮬레이터 선택 후 ▶ Run → 앱 설치·실행.
- 또는 CLI: `npm run android:run` (기기 연결 시).

## APK / AAB 만들기 (배포용)
- Android Studio → **Build > Build Bundle(s)/APK(s) > Build APK(s)** → `android/app/build/outputs/apk/` 에 생성.
- 스토어 업로드용 서명 AAB는 **Build > Generate Signed Bundle/APK** (키스토어 생성 필요).

## 앱 아이콘 / 이름
- 이름: `android/app/src/main/res/values/strings.xml`의 `app_name` (현재 "책갈피").
- 아이콘: Android Studio의 **Image Asset**(res/mipmap) 또는 `@capacitor/assets`로 생성.

## iOS
- macOS + Xcode 필요. `npx cap add ios` 후 동일 흐름(`npx cap open ios`). 이 저장소엔 android만 추가돼 있음.

## 주의 / 트러블슈팅
- **소셜 로그인 리다이렉트**: 원격 URL 방식이라 카카오/구글 콘솔에 등록된 기존 웹 Redirect URI 그대로 동작. 추가 등록 불필요.
- **혼합 콘텐츠**: `cleartext: false` — 모든 통신 HTTPS. 로컬 개발 서버로 테스트하려면 `server.url`을 임시로 로컬 IP(http)로 바꾸고 `cleartext: true`.
- 커밋에는 `android/build`, `.gradle`, `local.properties`, `*.apk` 등 산출물이 `android/.gitignore`로 제외됨.
