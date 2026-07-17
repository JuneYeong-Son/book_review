import crypto from 'crypto';
import type { Request } from 'express';
import { SESSION_SECRET } from './cookie.ts';

// 네이티브 앱(안드로이드)용 인증 토큰.
// 쿠키를 공유할 수 없는 번들 앱에서 Authorization: Bearer 로 인증하기 위한 것.
// 의존성 없이 HMAC-SHA256 서명(= 미니 JWT). payload.signature 형식.
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일
const b64 = (buf: Buffer) => buf.toString('base64url');
const sign = (payload: string) => b64(crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest());

export const signToken = (userId: string): string => {
  const payload = b64(Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS })));
  return `${payload}.${sign(payload)}`;
};

// 쿠키(웹) 또는 Authorization: Bearer(앱)에서 userId를 얻는다.
// 없으면 null — 401을 던지지 않는 "선택적 인증"용(requireAuth·피드백 등에서 공용).
export const resolveUserId = (req: Request): string | null => {
  const authHeader = req.get('Authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  return verifyToken(bearer) ?? (req.signedCookies?.userId as string | undefined) ?? null;
};

export const verifyToken = (token: string | undefined): string | null => {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  // 길이가 다르면 위조 → timingSafeEqual 예외 방지 위해 먼저 확인
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { uid: string; exp: number };
    if (!uid || typeof exp !== 'number' || exp < Date.now()) return null;
    return uid;
  } catch {
    return null;
  }
};
