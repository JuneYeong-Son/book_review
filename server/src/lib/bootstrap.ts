import prisma from './prisma.ts';

// 관리자 지정용 유저명 목록(배포/부팅 시 부트스트랩 전용). 기본 'reader'.
const adminUsernames = (process.env.ADMIN_USERNAMES ?? 'reader')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// 부팅 시 ADMIN_USERNAMES에 해당하는 계정의 isAdmin을 true로 보장한다.
// (재배포 때 seed가 건너뛰어져도 관리자 권한이 유지되도록.)
// 런타임 권한 판정은 여전히 User.isAdmin 컬럼으로만 하므로, 사용자가 가입/수정으로 스스로 승격할 수는 없다.
export const ensureAdmins = async () => {
  if (adminUsernames.length === 0) return;
  try {
    const { count } = await prisma.user.updateMany({
      where: { username: { in: adminUsernames }, isAdmin: false },
      data: { isAdmin: true }
    });
    if (count > 0) console.log(`[bootstrap] 관리자 ${count}명 지정: ${adminUsernames.join(', ')}`);
  } catch (err) {
    console.warn('[bootstrap] ensureAdmins 실패:', (err as Error).message);
  }
};
