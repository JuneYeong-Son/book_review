import prisma from '../lib/prisma.ts';

const withRelations = {
  include: {
    book: true,
    user: { select: { id: true, username: true, name: true, avatar: true } },
    likes: { select: { userId: true } }
  }
} as const;

export const findProgressById = (id: string) =>
  prisma.progress.findUnique({ where: { id }, include: { book: true, user: true } });

// 좋아요 토글용
export const findLike = (userId: string, progressId: string) =>
  prisma.like.findUnique({ where: { userId_progressId: { userId, progressId } } });

export const insertLike = (userId: string, progressId: string) =>
  prisma.like.create({ data: { userId, progressId } });

export const deleteLike = (userId: string, progressId: string) =>
  prisma.like.delete({ where: { userId_progressId: { userId, progressId } } });

export const countLikes = (progressId: string) =>
  prisma.like.count({ where: { progressId } });

export const findAllProgress = (skip?: number, take?: number) =>
  prisma.progress.findMany({ ...withRelations, orderBy: { createdAt: 'desc' }, skip, take });

// 연령대별 추천 집계용 (사용자 출생연도 포함, 내부용)
export const findProgressWithUserAge = () =>
  prisma.progress.findMany({
    include: {
      book: true,
      user: { select: { id: true, birthYear: true } },
      likes: { select: { userId: true } }
    }
  });

export const findProgressByUser = (userId: string) =>
  prisma.progress.findMany({ where: { userId }, ...withRelations, orderBy: { createdAt: 'desc' } });

// 한 책에 대한 모든 사용자의 서평
export const findProgressByBook = (bookId: string) =>
  prisma.progress.findMany({ where: { bookId }, ...withRelations, orderBy: { createdAt: 'desc' } });

// 특정 사용자가 한 책에 대해 남긴 기록들(날짜별 이력)
export const findProgressByUserAndBook = (userId: string, bookId: string) =>
  prisma.progress.findMany({
    where: { userId, bookId },
    ...withRelations,
    orderBy: { createdAt: 'desc' }
  });

// 사용자가 그 책에 대한 기록을 하나라도 가지고 있는지 (토론 개설 자격 확인용)
export const hasProgress = (userId: string, bookId: string) =>
  prisma.progress.findFirst({ where: { userId, bookId } });

const userSelect = { select: { id: true, username: true, name: true, avatar: true } } as const;

// 서평 상세 (책·작성자·좋아요·댓글 포함)
export const findProgressDetail = (id: string) =>
  prisma.progress.findUnique({
    where: { id },
    include: {
      book: true,
      user: userSelect,
      likes: { select: { userId: true } },
      comments: { include: { user: userSelect }, orderBy: { createdAt: 'asc' } }
    }
  });

// 서평 댓글 추가
export const insertReviewComment = (progressId: string, userId: string, text: string) =>
  prisma.reviewComment.create({
    data: { progressId, userId, text },
    include: { user: userSelect }
  });

// 서평 수정 (본인)
export const updateProgress = (
  id: string,
  data: { startPage?: number; endPage?: number; note?: string; quote?: string; rating?: number }
) => prisma.progress.update({ where: { id }, data, ...withRelations });

// 서평 삭제 (좋아요·댓글은 cascade)
export const deleteProgressById = (id: string) => prisma.progress.delete({ where: { id } });

// 기록할 때마다 새 항목을 추가
export const insertProgress = (data: {
  userId: string;
  bookId: string;
  startPage: number;
  endPage: number;
  note: string;
  quote: string;
  rating: number;
}) => prisma.progress.create({ data, ...withRelations });
