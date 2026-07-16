import { randomInt } from 'node:crypto';
import {
  findUserByUsername,
  findUserByEmail,
  findUserByNickname,
  insertUser,
  upsertEmailVerification,
  findEmailVerification,
  deleteEmailVerification
} from '../repository/auth_repository.ts';
import { validatePassword, hashPassword } from '../lib/password.ts';
import { toPublicUser } from './public_user.ts';
import { sendVerificationEmail } from './email_service.ts';

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

  const passwordHash = hashPassword(password);

  // 이메일 인증 생략 모드(EMAIL_VERIFICATION=off): 도메인 미보유 등으로 메일 발송이 불가할 때
  // 코드 단계 없이 바로 가입을 확정한다. (휴대폰 번호는 계속 수집.)
  if (process.env.EMAIL_VERIFICATION === 'off') {
    const user = await insertUser({
      username, email, name, nickname, phone,
      agreedAt: new Date(), passwordHash,
      avatar: avatar || '📚', birthYear
    });
    return { skipped: true as const, user: toPublicUser(user) };
  }

  const code = genCode();
  await upsertEmailVerification({
    email, username, name, nickname, phone, passwordHash,
    avatar: avatar || '📚', birthYear,
    code, expiresAt: new Date(Date.now() + CODE_TTL_MS)
  });

  let dev = false;
  try {
    ({ dev } = await sendVerificationEmail(email, code));
  } catch {
    return { error: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' as const };
  }
  // devCode는 로컬/개발(dev=true)에서만 반환된다. 프로덕션에서는 절대 코드가 노출되지 않는다.
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
