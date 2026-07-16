import bcrypt from 'bcryptjs';
import prisma from './prisma.ts';

// 관리자 지정용 유저명 목록(배포/부팅 시 부트스트랩 전용).
// 보안상 기본값 없음 — 반드시 ADMIN_USERNAMES 환경변수로 명시해야 관리자가 지정된다.
// (과거 기본값 'reader'는 공개된 시드 계정명이라, 그 이름으로 가입만 하면 승격되는 취약점이었음.)
const adminUsernames = (process.env.ADMIN_USERNAMES ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// 부팅 시 ADMIN_USERNAMES에 해당하는 계정의 isAdmin을 true로 보장한다.
// (재배포 때 seed가 건너뛰어져도 관리자 권한이 유지되도록.)
// 런타임 권한 판정은 여전히 User.isAdmin 컬럼으로만 하므로, 사용자가 가입/수정으로 스스로 승격할 수는 없다.
// 추가로 ADMIN_PASSWORD가 설정되면 해당 관리자 계정의 비밀번호를 그 값으로 재설정한다
// (라이브에 남아 있는 시드 기본 비밀번호를 안전하게 교정하는 용도).
export const ensureAdmins = async () => {
  if (adminUsernames.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[bootstrap] ADMIN_USERNAMES 미설정 — 관리자 자동 지정을 건너뜁니다.');
    }
    return;
  }
  try {
    const { count } = await prisma.user.updateMany({
      where: { username: { in: adminUsernames }, isAdmin: false },
      data: { isAdmin: true }
    });
    if (count > 0) console.log(`[bootstrap] 관리자 ${count}명 지정: ${adminUsernames.join(', ')}`);

    const pw = process.env.ADMIN_PASSWORD;
    if (pw && pw.length >= 8) {
      const passwordHash = bcrypt.hashSync(pw, 12);
      const reset = await prisma.user.updateMany({
        where: { username: { in: adminUsernames } },
        data: { passwordHash }
      });
      if (reset.count > 0) console.log(`[bootstrap] 관리자 ${reset.count}명 비밀번호 재설정 완료`);
    }
  } catch (err) {
    console.warn('[bootstrap] ensureAdmins 실패:', (err as Error).message);
  }
};
