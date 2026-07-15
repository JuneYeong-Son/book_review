// 관리자 지정: 환경변수 ADMIN_USERNAMES(쉼표 구분). 기본 'reader'.
const admins = (process.env.ADMIN_USERNAMES ?? 'reader')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const isAdminUsername = (username: string) => admins.includes(username);
