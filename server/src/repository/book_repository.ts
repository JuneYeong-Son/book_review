import prisma from '../lib/prisma.ts';

export const findAllBooks = () =>
  prisma.book.findMany({ orderBy: { createdAt: 'asc' } });

export const findBookById = (id: string) =>
  prisma.book.findUnique({ where: { id } });

export const findBookByIsbn = (isbn: string) =>
  prisma.book.findUnique({ where: { isbn } });

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
