import {
  findAllProgress,
  findProgressByUser,
  upsertProgress
} from '../repository/progress_repository.ts';
import { findBookById } from '../repository/book_repository.ts';

// 모든 사용자의 독서 기록 (다른 사람 기록도 볼 수 있음)
export const listProgress = () => findAllProgress();

export const listUserProgress = (userId: string) => findProgressByUser(userId);

// 오늘 무슨 책을 어디까지 읽었는지 + 서평/별점 기록 (책 1권당 최신값 유지)
export const saveProgress = async (
  userId: string,
  bookId: string,
  page: number,
  note: string,
  rating: number
) => {
  const book = await findBookById(bookId);
  if (!book) return { error: '책을 찾을 수 없습니다.' as const };
  if (page < 0) return { error: '페이지는 0 이상이어야 합니다.' as const };
  if (rating < 0 || rating > 5) return { error: '별점은 0~5 사이여야 합니다.' as const };

  const record = await upsertProgress(userId, bookId, page, note, rating);
  return { record };
};
