import {
  findUserById,
  updateUser,
  updateUserPassword,
  deleteUserCascade
} from '../repository/auth_repository.ts';
import { validatePassword, hashPassword, verifyPassword } from '../lib/password.ts';
import { toPublicUser } from './public_user.ts';
import { checkNickname } from './registration_service.ts';

// 프로필(이름·닉네임·아바타·출생연도) 수정
export const updateProfile = async (
  id: string,
  fields: { name?: string; nickname?: string; avatar?: string; birthYear?: number | null }
) => {
  const data: { name?: string; nickname?: string; avatar?: string; birthYear?: number | null } = {};
  if (fields.name) data.name = fields.name;
  if (fields.avatar) data.avatar = fields.avatar;
  if (fields.birthYear !== undefined) data.birthYear = fields.birthYear;
  if (fields.nickname !== undefined) {
    const current = await findUserById(id);
    if (current?.nickname !== fields.nickname) {
      const nickErr = await checkNickname(fields.nickname);
      if (nickErr) return { error: nickErr };
    }
    data.nickname = fields.nickname;
  }
  const user = await updateUser(id, data);
  return { user: toPublicUser(user) };
};

// 비밀번호 변경 (현재 비밀번호 확인)
export const changePassword = async (id: string, currentPassword: string, newPassword: string) => {
  const user = await findUserById(id);
  if (!user) return { error: '사용자를 찾을 수 없습니다.' as const };
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { error: '현재 비밀번호가 올바르지 않습니다.' as const };
  const weak = validatePassword(newPassword);
  if (weak) return { error: weak };
  await updateUserPassword(id, hashPassword(newPassword));
  return { ok: true as const };
};

// 회원 탈퇴 (비밀번호 확인 후 데이터 삭제)
export const deleteAccount = async (id: string, password: string) => {
  const user = await findUserById(id);
  if (!user) return { error: '사용자를 찾을 수 없습니다.' as const };
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: '비밀번호가 올바르지 않습니다.' as const };
  await deleteUserCascade(id);
  return { ok: true as const };
};
