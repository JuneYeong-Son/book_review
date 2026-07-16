# 안드로이드 앱 (Capacitor)

책갈피 웹앱(React+Vite)을 **Capacitor**로 감싼 네이티브 안드로이드 앱.

## 방식 (스토어 심사용 — 번들 + 토큰 인증)
- **dist를 앱에 번들**(자체 실행). API는 백엔드(Render)로 직접 호출. → 순수 웹뷰 래퍼가 아니라 스토어 정책에 적합.
- **인증:** 웹은 쿠키 세션, **앱은 토큰(Bearer)**. 로그인/회원가입 응답의 `token`을 localStorage에 저장하고 `Authorization` 헤더로 전송(앱 재시작해도 유지). 백엔드는 쿠키·토큰 둘 다 수용([server/src/lib/token.ts](../../server/src/lib/token.ts), `auth_middleware.ts`).
- **백엔드 주소:** 빌드 시 `VITE_API_URL`, 없으면 `client.ts`가 배포 백엔드(`book-review-api-...onrender.com`)로 폴백.
- **소셜 로그인:** 리다이렉트 기반이라 앱(번들)에선 **아직 미지원** → 앱에서는 버튼 숨김, **아이디 로그인/회원가입 사용**. (딥링크 방식은 다음 단계)
- 설정: [../../frontend/capacitor.config.ts](../../frontend/capacitor.config.ts) — `appId: com.bookreview.app`, `appName: 책갈피`, `webDir: dist`.

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

## 스토어(Google Play) 제출 체크리스트
- 개발자 계정($25 1회), **서명 AAB**(Generate Signed Bundle/APK → 키스토어), 대상 API 레벨 준수.
- **개인정보 처리방침 URL**(이메일·휴대폰 수집), **Data Safety 양식**, 콘텐츠 등급, 스크린샷/아이콘.

## 주의 / 트러블슈팅
- **프론트 변경 반영:** 번들 방식이라 `npm run build && npx cap sync android` 후 다시 빌드해야 앱에 반영됨.
- **소셜 로그인:** 앱에선 미지원(버튼 숨김). 필요 시 딥링크(커스텀 스킴) + 토큰 반환으로 확장(다음 단계).
- **백엔드 주소 고정:** 다른 백엔드로 빌드하려면 `VITE_API_URL` 설정 후 build/sync.
- 커밋에는 `android/build`, `.gradle`, `local.properties`, `*.apk`, 번들 웹자산(`assets/public`)이 gitignore로 제외됨.
