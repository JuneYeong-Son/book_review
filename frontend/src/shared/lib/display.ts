// 활동 표시명: 닉네임이 있으면 닉네임, 없으면 이름으로 폴백.
// (닉네임은 이메일 인증 가입부터 도입 — 기존 계정은 name으로 표시)
export const displayName = (u?: { nickname?: string | null; name?: string | null } | null): string =>
  (u?.nickname && u.nickname.trim()) || u?.name || '알 수 없음';
