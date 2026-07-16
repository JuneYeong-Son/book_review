import prisma from '../lib/prisma.ts';

export const insertFeedback = (data: {
  userId: string | null;
  name: string;
  kind: string;
  message: string;
  page: string;
}) => prisma.feedback.create({ data });

// 관리자용: 미처리 먼저, 최신순
export const findAllFeedback = () =>
  prisma.feedback.findMany({ orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }] });

export const updateFeedbackResolved = (id: string, resolved: boolean) =>
  prisma.feedback.update({ where: { id }, data: { resolved } });

export const deleteFeedbackById = (id: string) =>
  prisma.feedback.delete({ where: { id } });

export const countUnresolvedFeedback = () =>
  prisma.feedback.count({ where: { resolved: false } });
