import bcrypt from 'bcryptjs';
import {
  findUserByUsername,
  findUserById,
  insertUser
} from '../repository/auth_repository.ts';

// 로그인/회원가입 결과로 비밀번호 해시를 제외한 공개 정보만 반환
const toPublicUser = (user: { id: string; username: string; name: string }) => ({
  id: user.id,
  username: user.username,
  name: user.name
});

export const loginUser = async (username: string, password: string) => {
  const user = await findUserByUsername(username);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? toPublicUser(user) : null;
};

export const registerUser = async (username: string, name: string, password: string) => {
  const existing = await findUserByUsername(username);
  if (existing) return { error: '이미 존재하는 아이디입니다.' as const };

  const passwordHash = bcrypt.hashSync(password, 8);
  const user = await insertUser({ username, name, passwordHash });
  return { user: toPublicUser(user) };
};

export const getUser = async (id: string) => {
  const user = await findUserById(id);
  return user ? toPublicUser(user) : null;
};
