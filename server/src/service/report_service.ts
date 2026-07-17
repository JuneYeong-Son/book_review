import { Prisma } from '@prisma/client';
import { insertReport } from '../repository/report_repository.ts';

const VALID = ['review', 'discussion', 'user'];

// 서평/토론 신고. 1인 1대상 1회(@@unique)로 남용을 막고, 중복 신고는 조용히 성공 처리(멱등).
export const submitReport = async (reporterId: string, targetType: string, targetId: string, reason: string) => {
  if (!VALID.includes(targetType) || !targetId) {
    return { error: '잘못된 신고 대상입니다.' as const };
  }
  try {
    const report = await insertReport({ reporterId, targetType, targetId, reason: reason ?? '' });
    return { report };
  } catch (err) {
    // 이미 신고한 대상(unique 위반)이면 중복 없이 성공으로 취급
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { alreadyReported: true as const };
    }
    throw err;
  }
};
