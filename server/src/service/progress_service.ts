import {
  findAllProgress,
  findProgressByUser,
  findProgressByUserAndBook,
  findProgressById,
  insertProgress,
  findLike,
  insertLike,
  deleteLike,
  countLikes
} from '../repository/progress_repository.ts';
import { findBookById } from '../repository/book_repository.ts';
import { findUserById } from '../repository/auth_repository.ts';
import { createNotification } from './notification_service.ts';

// 모든 사용자의 독서 기록 (다른 사람 기록도 볼 수 있음)
export const listProgress = () => findAllProgress();

export const listUserProgress = (userId: string) => findProgressByUser(userId);

// 한 책에 대해 내가 남긴 기록들(날짜별)
export const listUserBookProgress = (userId: string, bookId: string) =>
  findProgressByUserAndBook(userId, bookId);

// 오늘 무슨 책을 몇 페이지부터 몇 페이지까지 읽었는지 + 서평/별점/글귀 기록 (매번 새 항목)
export const saveProgress = async (input: {
  userId: string;
  bookId: string;
  startPage: number;
  endPage: number;
  note: string;
  quote: string;
  rating: number;
}) => {
  const book = await findBookById(input.bookId);
  if (!book) return { error: '책을 찾을 수 없습니다.' as const };
  if (input.startPage < 0 || input.endPage < 0) {
    return { error: '페이지는 0 이상이어야 합니다.' as const };
  }
  if (input.endPage < input.startPage) {
    return { error: '끝 페이지는 시작 페이지보다 크거나 같아야 합니다.' as const };
  }
  if (input.rating < 0 || input.rating > 5) {
    return { error: '별점은 0~5 사이여야 합니다.' as const };
  }

  const record = await insertProgress(input);
  return { record };
};

// 서평 좋아요 토글. 남의 서평에 좋아요를 누르면 그 서평 작성자에게 알림 생성.
export const toggleLike = async (userId: string, progressId: string) => {
  const progress = await findProgressById(progressId);
  if (!progress) return { error: '서평을 찾을 수 없습니다.' as const };

  const existing = await findLike(userId, progressId);
  if (existing) {
    await deleteLike(userId, progressId);
    return { liked: false, count: await countLikes(progressId) };
  }

  await insertLike(userId, progressId);

  if (progress.userId !== userId) {
    const liker = await findUserById(userId);
    await createNotification(
      progress.userId,
      'like',
      `${liker?.name ?? '누군가'}님이 '${progress.book.title}' 서평에 좋아요를 눌렀어요.`,
      `/mypage/book/${progress.bookId}`
    );
  }

  return { liked: true, count: await countLikes(progressId) };
};
