import type { CapacitorConfig } from '@capacitor/cli';

// 책갈피 안드로이드 앱 (Capacitor).
// 스토어 심사용 "번들" 방식 — dist를 앱에 포함(자체 실행). API는 백엔드로 직접 호출.
// 인증: 웹은 쿠키, 앱은 토큰(Bearer). 백엔드 주소는 빌드 시 VITE_API_URL(없으면 client.ts 폴백).
// 소셜 로그인(카카오/구글)은 앱에선 아직 미지원(딥링크 필요) — 앱에서는 아이디 로그인 사용.
//
// 빌드 반영: 프론트 수정 후 `npm run build && npx cap sync` 로 앱에 동기화한다.
const config: CapacitorConfig = {
  appId: 'com.bookreview.app',
  appName: '책갈피',
  webDir: 'dist'
};

export default config;
