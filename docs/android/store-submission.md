# 안드로이드 스토어(Google Play) 심사 체크리스트

> 나중에 다시 볼 수 있게 정리한 제출 준비 문서. 빌드 방법은 [build.md](build.md) 참고.

## 현재 상태 (2026-07-17 기준)
| 항목 | 상태 |
|------|------|
| 앱 방식 | Capacitor **번들**(dist 포함) — 순수 웹뷰 래퍼 아님 ✅ |
| 인증 | 앱=토큰(Bearer), 웹=쿠키 ✅ |
| 권한 | `INTERNET`만 (최소) ✅ |
| targetSdk | 34 (최신 요구 충족) ✅ |
| 앱 이름 / 패키지 | `책갈피` / `com.bookreview.app` ✅ |
| 버전 | versionCode 1 / versionName 1.0 (`android/app/build.gradle`) ✅ |
| 개인정보 처리방침 | https://book-review-frontend-ov6h.onrender.com/privacy ✅ |
| 이용 약관 | https://book-review-frontend-ov6h.onrender.com/terms ✅ |
| 앱 아이콘 | ⛔ 기본 Capacitor 아이콘 → **교체 필요** |
| 서명 AAB | ⛔ 아직 (Android Studio에서 빌드) |
| 소셜 로그인(앱) | 미지원(버튼 숨김). 아이디 로그인 사용. |

## 제출 전 준비물 체크리스트

### 1. 개발자 계정
- [ ] Google Play Console 가입 + **등록비 $25(1회)** 결제 — https://play.google.com/console

### 2. 앱 빌드 (내 PC · Android Studio)
- [ ] JDK 17 + Android Studio 설치
- [ ] 서명 키(keystore) 생성 후 **안전 보관**(분실 시 업데이트 불가)
- [ ] `cd frontend && npm run build && npx cap sync android`
- [ ] Android Studio → **Build > Generate Signed Bundle/APK > Android App Bundle(AAB)**

### 3. 아이콘 / 그래픽 자료
- [ ] **앱 런처 아이콘**(적응형) — 1024×1024 소스로 생성(`@capacitor/assets` 또는 Android Studio Image Asset)
- [ ] **스토어 아이콘 512×512**(PNG)
- [ ] **피처 그래픽 1024×500**(PNG/JPG)
- [ ] **폰 스크린샷 최소 2장**(권장 4~8장) — 홈/서평/토론/마이페이지 등

### 4. 스토어 등록정보
- [ ] 앱 이름: 책갈피
- [ ] 짧은 설명(80자) / 자세한 설명
- [ ] 카테고리: 도서/참고자료(Books & Reference)
- [ ] 연락처 이메일: ic59673515@gmail.com

### 5. 정책·양식 (필수)
- [ ] **개인정보 처리방침 URL**: `/privacy` (위 링크)
- [ ] **Data Safety(데이터 보안) 양식**: 아래 "수집 데이터" 참고해 선언
- [ ] **콘텐츠 등급** 설문
- [ ] 광고 포함 여부: 없음
- [ ] 타깃 연령대

### 6. 제출
- [ ] 내부 테스트 트랙에 AAB 업로드 → 확인 후 프로덕션 심사 제출
- [ ] 심사 대기(보통 며칠)

## Data Safety 양식에 선언할 수집 데이터
서비스가 수집하는 것(개인정보 처리방침과 일치해야 함):
- **개인 식별**: 이름, 이메일, 휴대폰 번호, (소셜) 제공자 식별자
- **계정**: 아이디, 비밀번호(암호화), 닉네임, (선택) 출생연도
- **이용자 생성 콘텐츠**: 서평·토론·댓글·별점·피드백
- **앱 활동/기기**: 마지막 접속 일시
- 용도: 앱 기능·계정 관리. **제3자 판매 없음.** 처리 위탁: Render(호스팅)·Resend(메일)·Kakao/Google(로그인).
- 전송 중 암호화: 예(HTTPS). 삭제 요청 수단: 앱 내 회원 탈퇴.

## 반려 위험 & 대응
- **최소 기능(웹뷰) 정책**: 번들 + 토큰 인증으로 순수 웹뷰가 아님 → 위험 낮춤. 스크린샷/설명으로 기능성 강조.
- **개인정보/데이터 보안 불일치**: 처리방침과 Data Safety 선언을 반드시 일치시킬 것.
- **로그인 필수 앱**: 심사자가 테스트할 **데모 계정**을 스토어 "앱 액세스"에 제공(아이디+임시 비번).

## 남은 개발 작업(선택)
- 앱 소셜 로그인(딥링크) — 현재 앱은 아이디 로그인만.
- 아이콘/스플래시 자동 생성(`@capacitor/assets`, 소스 이미지 필요).
