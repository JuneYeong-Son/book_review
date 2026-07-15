import prisma from '../lib/prisma.ts';

const ownerSelect = { select: { id: true, username: true, name: true } } as const;

export const findAllDiscussions = () =>
  prisma.discussion.findMany({
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

export const insertComment = (discussionId: string, userId: string, text: string) =>
  prisma.comment.create({
    data: { discussionId, userId, text },
    include: { user: ownerSelect }
  });
