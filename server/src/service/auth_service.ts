import { findUserByUsername, findUserById, touchLastSeen } from '../repository/auth_repository.ts';
import type { AuthedUser } from '../repository/auth_repository.ts';
import { hashPassword, verifyPassword } from '../lib/password.ts';
import { toPublicUser } from './public_user.ts';

// 존재하지 않는 사용자 로그인 시에도 동일한 시간이 걸리도록 비교할 더미 해시 (타이밍 기반 유저명 열거 방지)
const DUMMY_HASH = hashPassword('timing-safe-dummy-password');

export const loginUser = async (username: string, password: string) => {
  const user = await findUserByUsername(username);
  // 사용자가 없어도 더미 해시로 bcrypt 비교를 수행해 응답 시간을 균일화한다.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { error: 'invalid' as const };
  if (user.suspended) return { error: 'suspended' as const };
  return { user: toPublicUser(user) };
};

// preloaded: requireAuth가 이미 조회해 둔 유저 행이 있으면 재조회를 생략(핫패스 /me 쿼리 절감).
export const getUser = async (id: string, preloaded?: AuthedUser) => {
  const user = preloaded ?? (await findUserById(id));
  if (!user) return null;
  await touchLastSeen(id); // 오늘의 접속자 집계
  return toPublicUser(user);
};
