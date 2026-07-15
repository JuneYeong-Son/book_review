import type { CookieOptions } from 'express';

// 배포(프론트·백엔드 다른 도메인) 시 cross-site 쿠키가 필요하므로
// production에서는 SameSite=None; Secure 로 설정한다.
const isProd = process.env.NODE_ENV === 'production';

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  maxAge: 1000 * 60 * 60 * 24 * 30 // 30일
};
