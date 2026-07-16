import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import {
  findUserByUsername,
  findUserByEmail,
  findUserByNickname,
  findUserById,
  insertUser,
  updateUser,
  updateUserPassword,
  deleteUserCascade,
  touchLastSeen,
  upsertEmailVerification,
  findEmailVerification,
  deleteEmailVerification
} from '../repository/auth_repository.ts';
import { sendVerificationEmail } from './email_service.ts';
// bcrypt cost (권장 ≥10~12)
const BCRYPT_COST = 12;
// 존재하지 않는 사용자 로그인 시에도 동일한 시간이 걸리도록 비교할 더미 해시 (타이밍 기반 유저명 열거 방지)
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', BCRYPT_COST);

// 비밀번호 보안 정책: 8자 이상 + 영문·숫자 혼합. 통과 시 null, 실패 시 안내 메시지.
// (너무 쉬운 비밀번호 방지 — 회원가입·비밀번호 변경에서 공통 사용)
export const validatePassword = (password: string): string | null => {
  if (typeof password !== 'string' || password.length < 8) {
    return '비밀번호는 8자 이상이어야 합니다.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.';
  }
  return null;
};

// 로그인/회원가입 결과로 비밀번호 해시를 제외한 공개 정보만 반환
const toPublicUser = (user: {
  id: string;
  username: string;
  email?: string | null;
  name: string;
  nickname?: string | null;
  avatar: string;
  birthYear: number | null;
  isAdmin: boolean;
  suspended: boolean;
}) => ({
  id: user.id,
  username: user.username,
  email: user.email ?? null,
  name: user.name,
  nickname: user.nickname ?? null,
  avatar: user.avatar,
  birthYear: user.birthYear,
  isAdmin: user.isAdmin,
  suspended: user.suspended
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_RE = /^[가-힣a-zA-Z0-9_]{2,16}$/; // 한글/영문/숫자/밑줄 2~16자
const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/; // 국내 휴대폰(하이픈 선택)
const CODE_TTL_MS = 10 * 60 * 1000; // 인증 코드 10분 유효

const genCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

// 닉네임 사용 가능 여부(형식 + 중복). 통과 시 null, 실패 시 사유.
export const checkNickname = async (nickname: string): Promise<string | null> => {
  if (!NICKNAME_RE.test(nickname ?? '')) {
    return '닉네임은 한글/영문/숫자/밑줄 2~16자로 입력해주세요.';
  }
  const existing = await findUserByNickname(nickname);
  return existing ? '이미 사용 중인 닉네임입니다.' : null;
};

// 이메일 사용 가능 여부(형식 + 중복).
export const checkEmail = async (email: string): Promise<string | null> => {
  if (!EMAIL_RE.test(email ?? '')) return '올바른 이메일 형식이 아닙니다.';
  const existing = await findUserByEmail(email);
  return existing ? '이미 가입된 이메일입니다.' : null;
};

export const loginUser = async (username: string, password: string) => {
  const user = await findUserByUsername(username);
  // 사용자가 없어도 더미 해시로 bcrypt 비교를 수행해 응답 시간을 균일화한다.
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { error: 'invalid' as const };
  if (user.suspended) return { error: 'suspended' as const };
  return { user: toPublicUser(user) };
};

// 회원가입 1단계: 입력 검증 → 인증 대기 저장 → 인증 코드 메일 발송.
// (실제 User는 아직 만들지 않는다. 2단계 인증 성공 시 승격)
export const startRegistration = async (input: {
  username: string;
  email: string;
  name: string;
  nickname: string;
  phone: string;
  password: string;
  avatar: string;
  birthYear: number | null;
  agreed: boolean;
}) => {
  const { username, email, name, nickname, phone, password, avatar, birthYear, agreed } = input;

  if (!agreed) return { error: '개인정보 수집·이용에 동의해야 가입할 수 있습니다.' as const };
  if (await findUserByUsername(username)) return { error: '이미 존재하는 아이디입니다.' as const };
  const emailErr = await checkEmail(email);
  if (emailErr) return { error: emailErr };
  const nickErr = await checkNickname(nickname);
  if (nickErr) return { error: nickErr };
  if (!PHONE_RE.test(phone ?? '')) return { error: '올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)' as const };
  const weak = validatePassword(password);
  if (weak) return { error: weak };

  const passwordHash = bcrypt.hashSync(password, BCRYPT_COST);
  const code = genCode();
  await upsertEmailVerification({
    email, username, name, nickname, phone, passwordHash,
    avatar: avatar || '📚', birthYear,
    code, expiresAt: new Date(Date.now() + CODE_TTL_MS)
  });

  const { dev } = await sendVerificationEmail(email, code);
  // dev 모드(메일 미설정)에서는 코드를 함께 돌려줘 화면에서 바로 입력할 수 있게 한다.
  return { ok: true as const, dev, devCode: dev ? code : undefined };
};

// 회원가입 2단계: 이메일+코드 검증 → User 생성.
export const verifyRegistration = async (email: string, code: string) => {
  const pending = await findEmailVerification(email);
  if (!pending) return { error: '인증 요청을 찾을 수 없습니다. 다시 시도해주세요.' as const };
  if (pending.expiresAt.getTime() < Date.now()) {
    await deleteEmailVerification(email);
    return { error: '인증 코드가 만료되었습니다. 다시 시도해주세요.' as const };
  }
  if (pending.code !== code) return { error: '인증 코드가 올바르지 않습니다.' as const };

  // 대기 사이에 선점됐을 수 있어 재확인
  if (await findUserByUsername(pending.username)) return { error: '이미 존재하는 아이디입니다.' as const };
  if (await findUserByEmail(email)) return { error: '이미 가입된 이메일입니다.' as const };
  if (await findUserByNickname(pending.nickname)) return { error: '이미 사용 중인 닉네임입니다.' as const };

  const user = await insertUser({
    username: pending.username,
    email: pending.email,
    name: pending.name,
    nickname: pending.nickname,
    phone: pending.phone,
    agreedAt: new Date(), // 가입 확정 시점에 동의 기록
    passwordHash: pending.passwordHash,
    avatar: pending.avatar,
    birthYear: pending.birthYear
  });
  await deleteEmailVerification(email);
  return { user: toPublicUser(user) };
};

export const getUser = async (id: string) => {
  const user = await findUserById(id);
  if (!user) return null;
  await touchLastSeen(id); // 오늘의 접속자 집계
  return toPublicUser(user);
};

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
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: '현재 비밀번호가 올바르지 않습니다.' as const };
  const weak = validatePassword(newPassword);
  if (weak) return { error: weak };
  await updateUserPassword(id, bcrypt.hashSync(newPassword, BCRYPT_COST));
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
