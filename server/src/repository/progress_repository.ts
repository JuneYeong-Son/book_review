import prisma from '../lib/prisma.ts';

const withRelations = {
  include: {
    book: true,
    user: { select: { id: true, username: true, name: true, avatar: true } },
    likes: { select: { userId: true } }
  }
} as const;

export const findProgressById = (id: string) =>
  prisma.progress.findUnique({ where: { id }, include: { book: true, user: true } });

// 좋아요 토글용
export const findLike = (userId: string, progressId: string) =>
  prisma.like.findUnique({ where: { userId_progressId: { userId, progressId } } });

export const insertLike = (userId: string, progressId: string) =>
  prisma.like.create({ data: { userId, progressId } });

export const deleteLike = (userId: string, progressId: string) =>
  prisma.like.delete({ where: { userId_progressId: { userId, progressId } } });

export const countLikes = (progressId: string) =>
  prisma.like.count({ where: { progressId } });

export const findAllProgress = () =>
  prisma.progress.findMany({ ...withRelations, orderBy: { createdAt: 'desc' } });

export const findProgressByUser = (userId: string) =>
  prisma.progress.findMany({ where: { userId }, ...withRelations, orderBy: { createdAt: 'desc' } });

// 특정 사용자가 한 책에 대해 남긴 기록들(날짜별 이력)
export const findProgressByUserAndBook = (userId: string, bookId: string) =>
  prisma.progress.findMany({
    where: { userId, bookId },
    ...withRelations,
    orderBy: { createdAt: 'desc' }
  });

// 사용자가 그 책에 대한 기록을 하나라도 가지고 있는지 (토론 개설 자격 확인용)
export const hasProgress = (userId: string, bookId: string) =>
  prisma.progress.findFirst({ where: { userId, bookId } });

// 기록할 때마다 새 항목을 추가
export const insertProgress = (data: {
  userId: string;
  bookId: string;
  startPage: number;
  endPage: number;
  note: string;
  quote: string;
  rating: number;
}) => prisma.progress.create({ data, ...withRelations });
