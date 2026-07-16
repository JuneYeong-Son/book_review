import { countUsers, countActiveSince, findUserById, deleteUserCascade } from '../repository/auth_repository.ts';
import { groupReports, deleteReportsForTarget, countReportedTargets } from '../repository/report_repository.ts';
import { findProgressById, deleteProgressById, findAllProgress } from '../repository/progress_repository.ts';
import { findDiscussionById, deleteDiscussionById } from '../repository/discussion_repository.ts';

// 관리자 통계: 오늘의 접속자 수, 회원 수, 신고된 게시물 수
export const getStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [members, todayVisitors, reportedPosts] = await Promise.all([
    countUsers(),
    countActiveSince(startOfToday),
    countReportedTargets()
  ]);
  return { members, todayVisitors, reportedPosts };
};

// 신고된 게시물 목록 (신고 많은 순, 대상 정보 포함)
export const listReportedPosts = async () => {
  const groups = await groupReports();
  const items = await Promise.all(
    groups.map(async (g) => {
      const count = g._count.targetId;
      if (g.targetType === 'review') {
        const p = await findProgressById(g.targetId);
        return p
          ? {
              targetType: 'review' as const,
              targetId: g.targetId,
              count,
              title: `${p.book.title} 서평`,
              author: p.user.name,
              snippet: p.note,
              link: `/reviews/${g.targetId}`
            }
          : null;
      }
      if (g.targetType === 'user') {
        const u = await findUserById(g.targetId);
        return u
          ? {
              targetType: 'user' as const,
              targetId: g.targetId,
              count,
              title: `${u.name} (@${u.username})`,
              author: u.name,
              snippet: '신고된 사용자',
              link: '#'
            }
          : null;
      }
      const d = await findDiscussionById(g.targetId);
      return d
        ? {
            targetType: 'discussion' as const,
            targetId: g.targetId,
            count,
            title: d.title,
            author: d.owner.name,
            snippet: d.description,
            link: `/discussions/${g.targetId}`
          }
        : null;
    })
  );
  return items.filter(Boolean);
};

// 전체 서평 목록 (신고 여부와 무관, 관리자 관리용 — 최신순)
export const listAllReviews = () => findAllProgress();

// 신고된 게시물 삭제 (신고 기록도 함께 삭제)
export const deleteReportedPost = async (targetType: string, targetId: string) => {
  if (targetType === 'review') {
    const p = await findProgressById(targetId);
    if (p) await deleteProgressById(targetId);
  } else if (targetType === 'discussion') {
    const d = await findDiscussionById(targetId);
    if (d) await deleteDiscussionById(targetId);
  } else if (targetType === 'user') {
    const u = await findUserById(targetId);
    if (u) await deleteUserCascade(targetId);
  } else {
    return { error: '잘못된 대상입니다.' as const };
  }
  await deleteReportsForTarget(targetType, targetId);
  return { ok: true as const };
};
