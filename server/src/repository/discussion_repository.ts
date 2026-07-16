import prisma from '../lib/prisma.ts';

const ownerSelect = { select: { id: true, username: true, name: true, avatar: true } } as const;

export const findAllDiscussions = (skip?: number, take?: number, bookId?: string) =>
  prisma.discussion.findMany({
    where: bookId ? { bookId } : undefined,
    include: {
      book: true,
      owner: ownerSelect,
      _count: { select: { comments: true } }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  });

// 내가 연(owner) 토론 + 내가 댓글 단 토론 = 참여한 토론
export const findDiscussionsByParticipant = (userId: string) =>
  prisma.discussion.findMany({
    where: {
      OR: [{ ownerId: userId }, { comments: { some: { userId } } }]
    },
    include: {
      book: true,
      owner: ownerSelect,
      _count: { select: { comments: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

export const findDiscussionById = (id: string) =>
  prisma.discussion.findUnique({
    where: { id },
    include: {
      book: true,
      owner: ownerSelect,
      comments: {
        include: { user: ownerSelect },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

export const insertDiscussion = (data: {
  bookId: string;
  ownerId: string;
  title: string;
  description: string;
}) =>
  prisma.discussion.create({
    data,
    include: { book: true, owner: ownerSelect }
  });

// 토론 삭제 (댓글은 cascade)
export const deleteDiscussionById = (id: string) =>
  prisma.discussion.delete({ where: { id } });

export const insertComment = (discussionId: string, userId: string, text: string) =>
  prisma.comment.create({
    data: { discussionId, userId, text },
    include: { user: ownerSelect }
  });
