import prisma from '../lib/prisma.ts';

export const insertReport = (data: { reporterId: string; targetType: string; targetId: string; reason: string }) =>
  prisma.report.create({ data });

// 신고 대상별 신고 수 (많은 순)
export const groupReports = () =>
  prisma.report.groupBy({
    by: ['targetType', 'targetId'],
    _count: { targetId: true },
    orderBy: { _count: { targetId: 'desc' } }
  });

export const deleteReportsForTarget = (targetType: string, targetId: string) =>
  prisma.report.deleteMany({ where: { targetType, targetId } });

export const countReportedTargets = async () => (await groupReports()).length;
