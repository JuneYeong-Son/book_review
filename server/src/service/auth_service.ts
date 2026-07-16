import bcrypt from 'bcryptjs';
import {
  findUserByUsername,
  findUserById,
  insertUser,
  updateUser,
  updateUserPassword,
  deleteUserCascade,
  touchLastSeen
} from '../repository/auth_repository.ts';
// bcrypt cost (권장 ≥10~12)
const BCRYPT_COST = 12;
// 존재하지 않는 사용자 로그인 시에도 동일한 시간이 걸리도록 비교할 더미 해시 (타이밍 기반 유저명 열거 방지)
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', BCRYPT_COST);

// 로그인/회원가입 결과로 비밀번호 해시를 제외한 공개 정보만 반환
const toPublicUser = (user: {
  id: string;
  username: string;
  name: string;
  avatar: string;
  birthYear: number | null;
  isAdmin: boolean;
}) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  avatar: user.avatar,
  birthYear: user.birthYear,
  isAdmin: user.isAdmin
});

export const loginUser = async (username: string, password: string) => {
  const user = await findUserByUsername(username);
  // 사용자가 없어도 더미 해시로 bcrypt 비교를 수행해 응답 시간을 균일화한다.
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return null;
  return toPublicUser(user);
};

export const registerUser = async (
  username: string,
  name: string,
  password: string,
  avatar: string,
  birthYear: number | null
) => {
  const existing = await findUserByUsername(username);
  if (existing) return { error: '이미 존재하는 아이디입니다.' as const };

  const passwordHash = bcrypt.hashSync(password, BCRYPT_COST);
  const user = await insertUser({ username, name, passwordHash, avatar: avatar || '📚', birthYear });
  return { user: toPublicUser(user) };
};

export const getUser = async (id: string) => {
  const user = await findUserById(id);
  if (!user) return null;
  await touchLastSeen(id); // 오늘의 접속자 집계
  return toPublicUser(user);
};

// 프로필(이름·아바타·출생연도) 수정
export const updateProfile = async (
  id: string,
  name?: string,
  avatar?: string,
  birthYear?: number | null
) => {
  const data: { name?: string; avatar?: string; birthYear?: number | null } = {};
  if (name) data.name = name;
  if (avatar) data.avatar = avatar;
  if (birthYear !== undefined) data.birthYear = birthYear;
  const user = await updateUser(id, data);
  return toPublicUser(user);
};

// 비밀번호 변경 (현재 비밀번호 확인)
export const changePassword = async (id: string, currentPassword: string, newPassword: string) => {
  const user = await findUserById(id);
  if (!user) return { error: '사용자를 찾을 수 없습니다.' as const };
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: '현재 비밀번호가 올바르지 않습니다.' as const };
  await updateUserPassword(id, bcrypt.hashSync(newPassword, 8));
  return { ok: true as const };
};

// 회원 탈퇴 (비밀번호 확인 후 데이터 삭제)
export const deleteAccount = async (id: string, password: string) => {
  const user = await findUserById(id);
  if (!user) return { error: '사용자를 찾을 수 없습니다.' as const };
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: '비밀번호가 올바르지 않습니다.' as const };
  await deleteUserCascade(id);
  return { ok: true as const };
};
