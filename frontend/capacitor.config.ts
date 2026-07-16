import type { CapacitorConfig } from '@capacitor/cli';

// 책갈피 안드로이드/iOS 앱 (Capacitor).
// v1은 배포된 웹사이트를 네이티브 셸로 감싸는 "원격 URL" 방식.
// → 소셜 로그인·쿠키 세션·이메일 인증이 웹과 동일하게 작동(백엔드 변경 불필요).
// 나중에 오프라인/스토어 심사용으로 dist를 번들하려면 server 블록을 지우고
// `npm run build` 후 `npx cap sync` 하면 된다(단, OAuth 리다이렉트/쿠키 추가 설정 필요).
const config: CapacitorConfig = {
  appId: 'com.bookreview.app',
  appName: '책갈피',
  webDir: 'dist',
  server: {
    url: 'https://book-review-frontend-ov6h.onrender.com',
    cleartext: false
  }
};

export default config;
