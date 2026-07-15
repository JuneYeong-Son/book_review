import {
  findAllBooks,
  findBookById,
  findInterestsByUser,
  findInterest,
  insertInterest,
  deleteInterest,
  findRecoExclusionsByUser,
  addRecoExclusion,
  removeRecoExclusion,
  upsertRating,
  findMyRating,
  aggregateRating
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

// 추천 안 받을 책 리스트
export const listRecoExclusions = (userId: string) => findRecoExclusionsByUser(userId);

export const excludeFromReco = async (userId: string, bookId: string) => {
  const book = await findBookById(bookId);
  if (!book) return { error: '책을 찾을 수 없습니다.' as const };
  await addRecoExclusion(userId, bookId);
  return { ok: true as const };
};

export const includeInReco = async (userId: string, bookId: string) => {
  await removeRecoExclusion(userId, bookId);
  return { ok: true as const };
};

// 책 별점 매기기 (책 1개당 사용자 1개)
export const rateBook = async (userId: string, bookId: string, value: number) => {
  const book = await findBookById(bookId);
  if (!book) return { error: '책을 찾을 수 없습니다.' as const };
  if (value < 1 || value > 5) return { error: '별점은 1~5 사이여야 합니다.' as const };
  await upsertRating(userId, bookId, value);
  return { ok: true as const };
};

// 책 별점 정보 (평균/개수, 로그인 시 내 별점)
export const getBookRating = async (bookId: string, userId?: string) => {
  const agg = await aggregateRating(bookId);
  const mine = userId ? await findMyRating(userId, bookId) : null;
  return {
    average: agg._avg.value ?? 0,
    count: agg._count.value ?? 0,
    mine: mine?.value ?? 0
  };
};
