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
export const kakaoAuthorizeUrl = (redirectUri: string): string | null => {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;
  const params = new URLSearchParams({
    client_id: key,
    redirect_uri: redirectUri,
    response_type: 'code'
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
  if (!tokenRes.ok) return { error: 'token' as const };
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return { error: 'token' as const };

  // 2) 프로필 조회
  const meRes = await fetch(KAKAO_ME_URL, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!meRes.ok) return { error: 'profile' as const };
  const me = (await meRes.json()) as {
    id: number;
    kakao_account?: { email?: string; profile?: { nickname?: string } };
  };
  const providerId = String(me.id);
  const email = me.kakao_account?.email ?? null;
  const kakaoNickname = me.kakao_account?.profile?.nickname ?? '';

  // 3) 이미 연결된 소셜 계정?
  const existing = await findUserByProvider('kakao', providerId);
  if (existing) {
    if (existing.suspended) return { error: 'suspended' as const };
    return { user: existing };
  }

  // 4) 같은 이메일의 기존 계정이 있으면 연결
  if (email) {
    const byEmail = await findUserByEmail(email);
    if (byEmail) {
      if (byEmail.suspended) return { error: 'suspended' as const };
      const linked = await linkProvider(byEmail.id, 'kakao', providerId);
      return { user: linked };
    }
  }

  // 5) 신규 생성 (소셜 전용 — 비밀번호는 사용 불가한 랜덤 해시)
  const nickname = await uniqueNickname(kakaoNickname);
  const user = await insertUser({
    username: `kakao_${providerId}`,
    email,
    name: kakaoNickname || nickname,
    nickname,
    provider: 'kakao',
    providerId,
    agreedAt: new Date(), // 첫 소셜 로그인(카카오 동의 화면 경유) 시 동의 처리
    passwordHash: bcrypt.hashSync(randomBytes(24).toString('hex'), 8),
    avatar: '📚',
    birthYear: null
  });
  return { user };
};
