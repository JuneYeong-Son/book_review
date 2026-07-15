import { insertReport } from '../repository/report_repository.ts';

const VALID = ['review', 'discussion'];

// 서평/토론 신고
export const submitReport = async (
  reporterId: string,
  targetType: string,
  targetId: string,
  reason: string
) => {
  if (!VALID.includes(targetType) || !targetId) {
    return { error: '잘못된 신고 대상입니다.' as const };
  }
  const report = await insertReport({ reporterId, targetType, targetId, reason: reason ?? '' });
  return { report };
};
