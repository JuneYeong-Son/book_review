import prisma from '../lib/prisma.ts';

const withRelations = {
  include: {
    book: true,
    user: { select: { id: true, username: true, name: true } }
  }
} as const;

export const findAllProgress = () =>
  prisma.progress.findMany({ ...withRelations, orderBy: { updatedAt: 'desc' } });

export const findProgressByUser = (userId: string) =>
  prisma.progress.findMany({ where: { userId }, ...withRelations, orderBy: { updatedAt: 'desc' } });

export const findProgress = (userId: string, bookId: string) =>
  prisma.progress.findUnique({ where: { userId_bookId: { userId, bookId } } });

// 있으면 갱신, 없으면 생성
export const upsertProgress = (
  userId: string,
  bookId: string,
  page: number,
  note: string,
  rating: number
) =>
  prisma.progress.upsert({
    where: { userId_bookId: { userId, bookId } },
    update: { page, note, rating },
    create: { userId, bookId, page, note, rating },
    ...withRelations
  });
