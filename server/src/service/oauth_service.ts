import { randomBytes, randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  findUserByProvider,
  findUserByEmail,
  findUserByNickname,
  linkProvider,
  insertUser
} from '../repository/auth_repository.ts';

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_ME_URL = 'https://kapi.kakao.com/v2/user/me';

// 카카오 동의 화면으로 보낼 authorize URL. 키 미설정 시 null.
// state: CSRF 방지용 난수(콜백에서 대조).
export const kakaoAuthorizeUrl = (redirectUri: string, state: string): string | null => {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({
    client_id: key,
    redirect_uri: redirectUri,
    response_type: 'code',
    state
  });
  return `${KAKAO_AUTH_URL}?${params.toString()}`;
};

// 카카오 닉네임을 우리 규칙(한글/영문/숫자/밑줄 2~16자)에 맞게 정리
const sanitizeNickname = (raw: string) => {
  const cleaned = (raw || '').replace(/[^가-힣a-zA-Z0-9_]/g, '').slice(0, 16);
  return cleaned.length >= 2 ? cleaned : '';
};

// 중복되지 않는 닉네임 확보(중복이면 숫자 붙여 재시도)
const uniqueNickname = async (base: string) => {
  const seed = sanitizeNickname(base) || `카카오${randomInt(1000, 9999)}`;
  let candidate = seed;
  for (let i = 0; i < 5; i++) {
    if (!(await findUserByNickname(candidate))) return candidate;
    const suffix = String(randomInt(0, 10000)).padStart(4, '0');
    candidate = `${seed.slice(0, 11)}${suffix}`;
  }
  return `${seed.slice(0, 8)}${randomBytes(3).toString('hex')}`;
};

// 소셜 프로필 → 우리 계정 연결/생성 (제공자 공통).
// ①이미 연결된 소셜계정 → 로그인, ②같은 이메일 계정 → 연결, ③없으면 신규 생성.
const resolveSocialUser = async (
  provider: string,
  providerId: string,
  email: string | null,
  nameHint: string
) => {
  const existing = await findUserByProvider(provider, providerId);
  if (existing) {
    if (existing.suspended) return { error: 'suspended' as const };
    return { user: existing };
  }
  if (email) {
    const byEmail = await findUserByEmail(email);
    if (byEmail) {
      if (byEmail.suspended) return { error: 'suspended' as const };
      const linked = await linkProvider(byEmail.id, provider, providerId);
      return { user: linked };
    }
  }
  const nickname = await uniqueNickname(nameHint);
  const user = await insertUser({
    username: `${provider}_${providerId}`,
    email,
    name: nameHint || nickname,
    nickname,
    provider,
    providerId,
    agreedAt: new Date(), // 첫 소셜 로그인(제공자 동의 화면 경유) 시 동의 처리
    passwordHash: bcrypt.hashSync(randomBytes(24).toString('hex'), 8),
    avatar: '📚',
    birthYear: null
  });
  return { user };
};

// 카카오 code → 로그인/가입 처리. 성공 시 { user }, 실패 시 { error }.
export const loginWithKakao = async (code: string, redirectUri: string) => {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return { error: 'unconfigured' as const };

  // 1) code → access_token
  const tokenRes = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: key,
      redirect_uri: redirectUri,
      code,
      ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {})
    }).toString()
  });
  if (!tokenRes.ok) {
    console.error('[kakao] token exchange failed', tokenRes.status, await tokenRes.text().catch(() => ''));
    return { error: 'token' as const };
  }
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return { error: 'token' as const };

  // 2) 프로필 조회
  const meRes = await fetch(KAKAO_ME_URL, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!meRes.ok) {
    console.error('[kakao] profile fetch failed', meRes.status, await meRes.text().catch(() => ''));
    return { error: 'profile' as const };
  }
  const me = (await meRes.json()) as {
    id: number;
    kakao_account?: { email?: string; is_email_verified?: boolean; profile?: { nickname?: string } };
  };
  const providerId = String(me.id);
  // 검증된 이메일만 계정 연결에 사용(미검증 이메일로 남의 계정에 연결되는 탈취 방지)
  const account = me.kakao_account;
  const email = account?.is_email_verified === true ? (account.email ?? null) : null;
  const kakaoNickname = account?.profile?.nickname ?? '';

  return resolveSocialUser('kakao', providerId, email, kakaoNickname);
};

// --- 구글 ---
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ME_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export const googleAuthorizeUrl = (redirectUri: string, state: string): string | null => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const loginWithGoogle = async (code: string, redirectUri: string) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { error: 'unconfigured' as const };

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code
    }).toString()
  });
  if (!tokenRes.ok) {
    console.error('[google] token exchange failed', tokenRes.status, await tokenRes.text().catch(() => ''));
    return { error: 'token' as const };
  }
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return { error: 'token' as const };

  const meRes = await fetch(GOOGLE_ME_URL, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!meRes.ok) {
    console.error('[google] profile fetch failed', meRes.status, await meRes.text().catch(() => ''));
    return { error: 'profile' as const };
  }
  const me = (await meRes.json()) as { id?: string; email?: string; verified_email?: boolean; name?: string };
  if (!me.id) return { error: 'profile' as const };

  // 검증된 이메일만 계정 연결에 사용
  const email = me.verified_email === true ? (me.email ?? null) : null;
  return resolveSocialUser('google', me.id, email, me.name ?? '');
};
