import {
  findAllDiscussions,
  findDiscussionsByParticipant,
  findDiscussionById,
  insertDiscussion,
  insertComment
} from '../repository/discussion_repository.ts';
import { findBookById } from '../repository/book_repository.ts';
import { hasProgress } from '../repository/progress_repository.ts';
import { findUserById } from '../repository/auth_repository.ts';
import { createNotification } from './notification_service.ts';

export const listDiscussions = () => findAllDiscussions();

// 내가 참여한(연 토론 + 댓글 단) 토론 목록
export const listMyDiscussions = (userId: string) => findDiscussionsByParticipant(userId);

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

  const progress = await hasProgress(userId, bookId);
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

  // 내가 연 토론이 아니라면, 토론을 연 사람에게 알림
  if (discussion.ownerId !== userId) {
    const commenter = await findUserById(userId);
    await createNotification(
      discussion.ownerId,
      'comment',
      `${commenter?.name ?? '누군가'}님이 '${discussion.title}' 토론에 댓글을 남겼어요.`,
      `/discussions/${discussionId}`
    );
  }

  return { comment };
};
