import {
  findAllDiscussions,
  findDiscussionById,
  insertDiscussion,
  insertComment
} from '../repository/discussion_repository.ts';
import { findBookById } from '../repository/book_repository.ts';
import { findProgress } from '../repository/progress_repository.ts';

export const listDiscussions = () => findAllDiscussions();

export const getDiscussion = (id: string) => findDiscussionById(id);

// 자신이 읽거나 읽는 중인(=진행 기록이 있는) 책에 대해서만 토론을 열 수 있음
export const openDiscussion = async (
  userId: string,
  bookId: string,
  title: string,
  description: string
) => {
  const book = await findBookById(bookId);
  if (!book) return { error: '책을 찾을 수 없습니다.' as const };

  const progress = await findProgress(userId, bookId);
  if (!progress) {
    return { error: '읽었거나 읽는 중인 책에 대해서만 토론을 열 수 있습니다.' as const };
  }

  const discussion = await insertDiscussion({ ownerId: userId, bookId, title, description });
  return { discussion };
};

// 토론에는 로그인한 누구나 댓글로 참여 가능
export const addComment = async (discussionId: string, userId: string, text: string) => {
  const discussion = await findDiscussionById(discussionId);
  if (!discussion) return { error: '토론을 찾을 수 없습니다.' as const };

  const comment = await insertComment(discussionId, userId, text);
  return { comment };
};
