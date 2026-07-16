// 비밀번호 해시 등 민감 정보를 제외한 공개 사용자 정보만 반환.
// (로그인·회원가입·프로필 응답에서 공용 — 정보 은닉 지점)
export const toPublicUser = (user: {
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
