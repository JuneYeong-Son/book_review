import { updateUser, updateUserPassword, deleteUserCascade } from '../repository/auth_repository.ts';
import type { AuthedUser } from '../repository/auth_repository.ts';
import { validatePassword, hashPassword, verifyPassword } from '../lib/password.ts';
import { toPublicUser } from './public_user.ts';
import { checkNickname } from './registration_service.ts';

// 이 서비스들은 requireAuth가 로드한 유저(AuthedUser)를 받는다.
// → 유저를 id로 재조회하지 않고(로드는 requireAuth 한 곳에 집중), "유저 없음" 방어도 불필요.

// 프로필(이름·닉네임·아바타·출생연도) 수정
export const updateProfile = async (
  user: AuthedUser,
  fields: { name?: string; nickname?: string; avatar?: string; birthYear?: number | null }
) => {
  const data: { name?: string; nickname?: string; avatar?: string; birthYear?: number | null } = {};
  if (fields.name) data.name = fields.name;
  if (fields.avatar) data.avatar = fields.avatar;
  if (fields.birthYear !== undefined) data.birthYear = fields.birthYear;
  if (fields.nickname !== undefined) {
    if (user.nickname !== fields.nickname) {
      const nickErr = await checkNickname(fields.nickname);
      if (nickErr) return { error: nickErr };
    }
    data.nickname = fields.nickname;
  }
  const updated = await updateUser(user.id, data);
  return { user: toPublicUser(updated) };
};

// 비밀번호 변경 (현재 비밀번호 확인)
export const changePassword = async (user: AuthedUser, currentPassword: string, newPassword: string) => {
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { error: '현재 비밀번호가 올바르지 않습니다.' as const };
  const weak = validatePassword(newPassword);
  if (weak) return { error: weak };
  await updateUserPassword(user.id, hashPassword(newPassword));
  return { ok: true as const };
};

// 회원 탈퇴 (비밀번호 확인 후 데이터 삭제)
export const deleteAccount = async (user: AuthedUser, password: string) => {
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: '비밀번호가 올바르지 않습니다.' as const };
  await deleteUserCascade(user.id);
  return { ok: true as const };
};
