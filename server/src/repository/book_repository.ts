import prisma from '../lib/prisma.ts';

export const findAllBooks = () =>
  prisma.book.findMany({ orderBy: { createdAt: 'asc' } });

export const findBookById = (id: string) =>
  prisma.book.findUnique({ where: { id } });

export const findBookByIsbn = (isbn: string) =>
  prisma.book.findUnique({ where: { isbn } });

export const findBooksByTitle = (title: string) =>
  prisma.book.findMany({ where: { title } });

export const createBook = (data: {
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: string;
  isbn: string | null;
  publisher: string;
  description: string;
}) => prisma.book.create({ data });

export const findInterestsByUser = (userId: string) =>
  prisma.interest.findMany({ where: { userId }, include: { book: true } });

export const findInterest = (userId: string, bookId: string) =>
  prisma.interest.findUnique({ where: { userId_bookId: { userId, bookId } } });

export const insertInterest = (userId: string, bookId: string) =>
  prisma.interest.create({ data: { userId, bookId } });

export const deleteInterest = (userId: string, bookId: string) =>
  prisma.interest.delete({ where: { userId_bookId: { userId, bookId } } });

// 추천 안 받을 책 리스트
export const findRecoExclusionsByUser = (userId: string) =>
  prisma.recoExclusion.findMany({ where: { userId }, include: { book: true }, orderBy: { createdAt: 'desc' } });

export const findRecoExclusionIds = async (userId: string) =>
  (await prisma.recoExclusion.findMany({ where: { userId }, select: { bookId: true } })).map((r) => r.bookId);

export const addRecoExclusion = (userId: string, bookId: string) =>
  prisma.recoExclusion.upsert({
    where: { userId_bookId: { userId, bookId } },
    update: {},
    create: { userId, bookId }
  });

export const removeRecoExclusion = (userId: string, bookId: string) =>
  prisma.recoExclusion.deleteMany({ where: { userId, bookId } });

// 책 별점
export const upsertRating = (userId: string, bookId: string, value: number) =>
  prisma.rating.upsert({
    where: { userId_bookId: { userId, bookId } },
    update: { value },
    create: { userId, bookId, value }
  });

export const findMyRating = (userId: string, bookId: string) =>
  prisma.rating.findUnique({ where: { userId_bookId: { userId, bookId } } });

export const aggregateRating = (bookId: string) =>
  prisma.rating.aggregate({ where: { bookId }, _avg: { value: true }, _count: { value: true } });
