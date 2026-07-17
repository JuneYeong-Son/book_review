import prisma from '../lib/prisma.ts';

export const findUserByUsername = (username: string) => prisma.user.findUnique({ where: { username } });

// requireAuth가 조회해 res.locals.user에 붙여두는 인증된 유저 행 타입.
// current-user seam: 하위 서비스는 이 유저를 재조회하지 않고 인자로 받는다.
export type AuthedUser = NonNullable<Awaited<ReturnType<typeof findUserById>>>;

export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });

export const findUserByNickname = (nickname: string) => prisma.user.findUnique({ where: { nickname } });

export const findUserByProvider = (provider: string, providerId: string) =>
  prisma.user.findFirst({ where: { provider, providerId } });

// 기존(이메일) 계정에 소셜 계정을 연결
export const linkProvider = (id: string, provider: string, providerId: string) =>
  prisma.user.update({ where: { id }, data: { provider, providerId } });

export const findUserById = (id: string) => prisma.user.findUnique({ where: { id } });

export const insertUser = (data: {
  username: string;
  email?: string | null;
  name: string;
  nickname?: string | null;
  phone?: string | null;
  agreedAt?: Date | null;
  provider?: string | null;
  providerId?: string | null;
  passwordHash: string;
  avatar: string;
  birthYear: number | null;
}) => prisma.user.create({ data });

export const updateUser = (
  id: string,
  data: { name?: string; nickname?: string; avatar?: string; birthYear?: number | null }
) => prisma.user.update({ where: { id }, data });

export const updateUserPassword = (id: string, passwordHash: string) =>
  prisma.user.update({ where: { id }, data: { passwordHash } });

export const touchLastSeen = (id: string) => prisma.user.update({ where: { id }, data: { lastSeenAt: new Date() } });

export const countUsers = () => prisma.user.count();

// 관리자 회원 관리용: 전체 회원 목록 (가입 순, 비밀번호 해시 제외)
export const findAllUsers = () =>
  prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      birthYear: true,
      nickname: true,
      isAdmin: true,
      suspended: true,
      lastSeenAt: true,
      createdAt: true
    }
  });

// --- 이메일 인증 대기 ---
export const upsertEmailVerification = (data: {
  email: string;
  username: string;
  name: string;
  nickname: string;
  phone: string;
  passwordHash: string;
  avatar: string;
  birthYear: number | null;
  code: string;
  expiresAt: Date;
}) =>
  prisma.emailVerification.upsert({
    where: { email: data.email },
    create: data,
    update: data
  });

export const findEmailVerification = (email: string) => prisma.emailVerification.findUnique({ where: { email } });

export const deleteEmailVerification = (email: string) =>
  prisma.emailVerification.delete({ where: { email } }).catch(() => null);

// 관리자 권한 부여/회수
export const updateUserAdmin = (id: string, isAdmin: boolean) =>
  prisma.user.update({ where: { id }, data: { isAdmin } });

// 활동 정지/해제
export const updateUserSuspended = (id: string, suspended: boolean) =>
  prisma.user.update({ where: { id }, data: { suspended } });

export const countActiveSince = (since: Date) => prisma.user.count({ where: { lastSeenAt: { gte: since } } });

// 회원 탈퇴: 외래키 순서에 맞춰 사용자 관련 데이터를 모두 삭제
export const deleteUserCascade = (id: string) =>
  prisma.$transaction([
    prisma.like.deleteMany({ where: { userId: id } }),
    prisma.comment.deleteMany({ where: { userId: id } }),
    prisma.reviewComment.deleteMany({ where: { userId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    prisma.interest.deleteMany({ where: { userId: id } }),
    prisma.progress.deleteMany({ where: { userId: id } }), // 내 서평의 좋아요·댓글은 cascade
    prisma.discussion.deleteMany({ where: { ownerId: id } }), // 내 토론의 댓글은 cascade
    prisma.user.delete({ where: { id } })
  ]);
