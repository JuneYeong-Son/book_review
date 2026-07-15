import {
  findAllBooks,
  findBookById,
  findInterestsByUser,
  findInterest,
  insertInterest,
  deleteInterest
} from '../repository/book_repository.ts';

export const listBooks = () => findAllBooks();

export const getBook = (id: string) => findBookById(id);

export const listInterests = (userId: string) => findInterestsByUser(userId);

// 관심 책 지정/해제 토글
export const toggleInterest = async (userId: string, bookId: string) => {
  const book = await findBookById(bookId);
  if (!book) return { error: '책을 찾을 수 없습니다.' as const };

  const existing = await findInterest(userId, bookId);
  if (existing) {
    await deleteInterest(userId, bookId);
    return { interested: false };
  }
  await insertInterest(userId, bookId);
  return { interested: true };
};
