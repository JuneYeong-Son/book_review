import bcrypt from 'bcryptjs';

// bcrypt cost (권장 ≥10~12)
export const BCRYPT_COST = 12;

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

export const hashPassword = (password: string) => bcrypt.hashSync(password, BCRYPT_COST);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
