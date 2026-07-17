import crypto from 'crypto';
import type { CookieOptions } from 'express';

// 배포(프론트·백엔드 다른 도메인) 시 cross-site 쿠키가 필요하므로
// production에서는 SameSite=None; Secure 로 설정한다.
const isProd = process.env.NODE_ENV === 'production';

// 세션 쿠키 서명용 시크릿. 이 시크릿이 없으면 쿠키(userId)를 위조할 수 있으므로 필수.
// prod에서 미설정 시 부팅마다 랜덤값을 써서(재시작하면 로그인 풀림) SESSION_SECRET 설정을 유도.
export const SESSION_SECRET =
  process.env.SESSION_SECRET || (isProd ? crypto.randomBytes(32).toString('hex') : 'dev-insecure-session-secret');

if (isProd && !process.env.SESSION_SECRET) {
  console.warn(
    '[auth] SESSION_SECRET 미설정 — 부팅마다 임시 시크릿을 사용합니다(재시작 시 세션 만료). 배포 환경변수에 SESSION_SECRET을 설정하세요.'
  );
}

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  signed: true, // cookie-parser(SESSION_SECRET)로 HMAC 서명 → 클라이언트 위조 불가
  maxAge: 1000 * 60 * 60 * 24 * 30 // 30일
};
