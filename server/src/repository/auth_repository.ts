import prisma from '../lib/prisma.ts';

export const findUserByUsername = (username: string) =>
  prisma.user.findUnique({ where: { username } });

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const insertUser = (data: {
  username: string;
  name: string;
  passwordHash: string;
  avatar: string;
}) => prisma.user.create({ data });

export const updateUser = (id: string, data: { name?: string; avatar?: string }) =>
  prisma.user.update({ where: { id }, data });

export const updateUserPassword = (id: string, passwordHash: string) =>
  prisma.user.update({ where: { id }, data: { passwordHash } });

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
