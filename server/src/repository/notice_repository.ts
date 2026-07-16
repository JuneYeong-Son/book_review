import prisma from '../lib/prisma.ts';

// 고정 공지 먼저, 그다음 최신순
export const findAllNotices = () =>
  prisma.notice.findMany({ orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] });

export const findNoticeById = (id: string) => prisma.notice.findUnique({ where: { id } });

export const insertNotice = (data: { title: string; body: string; pinned: boolean }) =>
  prisma.notice.create({ data });

export const updateNoticeById = (
  id: string,
  data: { title?: string; body?: string; pinned?: boolean }
) => prisma.notice.update({ where: { id }, data });

export const deleteNoticeById = (id: string) => prisma.notice.delete({ where: { id } });
