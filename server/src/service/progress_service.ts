import {
  findAllProgress,
  findProgressByUser,
  findProgressByUserAndBook,
  findProgressByBook,
  findProgressById,
  findProgressDetail,
  findProgressByBookSeq,
  maxBookSeqByBook,
  insertProgress,
  insertReviewComment,
  updateProgress,
  deleteProgressById,
  findLike,
  insertLike,
  deleteLike,
  countLikes
} from '../repository/progress_repository.ts';
import { findBookById } from '../repository/book_repository.ts';
import { findUserById } from '../repository/auth_repository.ts';
import { createNotification } from './notification_service.ts';

// 서평(note)을 적을 경우 요구되는 최소 길이 (과하게 짧은 글 방지)
const MIN_NOTE_LEN = 10;

// 서평이 비어있지 않은데 너무 짧으면 안내 메시지, 아니면 null. (작성·수정 공용)
const noteTooShortError = (note: string): string | null => {
  const t = note.trim();
  return t.length > 0 && t.length < MIN_NOTE_LEN
    ? `서평이 너무 짧아요. ${MIN_NOTE_LEN}자 이상 적어주세요.`
    : null;
};

// 모든 사용자의 독서 기록 (다른 사람 기록도 볼 수 있음, 페이지네이션 지원)
export const listProgress = (skip?: number, take?: number) => findAllProgress(skip, take);

export const listUserProgress = (userId: string) => findProgressByUser(userId);

// 한 책에 대해 내가 남긴 기록들(날짜별)
export const listUserBookProgress = (userId: string, bookId: string) =>
  findProgressByUserAndBook(userId, bookId);

// 한 책에 대한 모든 사용자의 서평
export const listBookProgress = (bookId: string) => findProgressByBook(bookId);

// 서평 상세
export const getProgressDetail = (id: string) => findProgressDetail(id);

// 책별 순번으로 서평 상세
export const getProgressByBookSeq = (bookId: string, bookSeq: number) =>
  findProgressByBookSeq(bookId, bookSeq);

// 서평 수정 (본인만)
export const editReview = async (
  userId: string,
  id: string,
  fields: { startPage?: number; endPage?: number; note?: string; quote?: string; rating?: number }
) => {
  const progress = await findProgressById(id);
  if (!progress) return { error: '서평을 찾을 수 없습니다.' as const };
  if (progress.userId !== userId) return { error: '본인 서평만 수정할 수 있습니다.' as const };
  if (fields.rating !== undefined && (fields.rating < 0 || fields.rating > 5)) {
    return { error: '별점은 0~5 사이여야 합니다.' as const };
  }
  if (fields.note !== undefined) {
    const noteErr = noteTooShortError(fields.note);
    if (noteErr) return { error: noteErr };
  }
  const record = await updateProgress(id, fields);
  return { record };
};

// 서평 삭제 (본인만)
export const removeReview = async (userId: string, id: string) => {
  const progress = await findProgressById(id);
  if (!progress) return { error: '서평을 찾을 수 없습니다.' as const };
  if (progress.userId !== userId) return { error: '본인 서평만 삭제할 수 있습니다.' as const };
  await deleteProgressById(id);
  return { ok: true as const };
};

// 서평에 댓글 달기 (남의 서평이면 작성자에게 알림)
export const addReviewComment = async (progressId: string, userId: string, text: string) => {
  const progress = await findProgressById(progressId);
  if (!progress) return { error: '서평을 찾을 수 없습니다.' as const };

  const comment = await insertReviewComment(progressId, userId, text);

  if (progress.userId !== userId) {
    const commenter = await findUserById(userId);
    await createNotification(
      progress.userId,
      'comment',
      `${commenter?.name ?? '누군가'}님이 '${progress.book.title}' 서평에 댓글을 남겼어요.`,
      `/books/${progress.bookId}/reviews/${progress.bookSeq}`
    );
  }
  return { comment };
};

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
  // 과하게 짧은 서평 방지: 글을 적었다면 10자 이상. (빈 값은 페이지만 남기는 독서 기록으로 허용)
  const noteErr = noteTooShortError(input.note);
  if (noteErr) return { error: noteErr };

  // 그 책의 다음 순번 = 현재 최대 순번 + 1.
  // count가 아니라 max로 매겨야 서평 삭제 후에도 순번이 재사용(충돌)되지 않아,
  // /books/:bookId/reviews/:bookSeq 로 들어갔을 때 다른 서평이 뜨는 문제가 없다.
  const bookSeq = (await maxBookSeqByBook(input.bookId)) + 1;
  const record = await insertProgress({ ...input, bookSeq });
  return { record };
};

// 서평 좋아요 토글. 남의 서평에 좋아요를 누르면 그 서평 작성자에게 알림 생성.
export const toggleLike = async (userId: string, progressId: string) => {
  const progress = await findProgressById(progressId);
  if (!progress) return { error: '서평을 찾을 수 없습니다.' as const };
  if (progress.userId === userId) return { error: '자신의 서평에는 좋아요를 누를 수 없습니다.' as const };

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
