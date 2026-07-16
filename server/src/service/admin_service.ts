import {
  countUsers,
  countActiveSince,
  findUserById,
  deleteUserCascade,
  findAllUsers,
  updateUserAdmin,
  updateUserSuspended
} from '../repository/auth_repository.ts';
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

// --- 회원 관리 ---

// 전체 회원 목록 (관리자용)
export const listMembers = () => findAllUsers();

// 관리자 권한 부여/회수. 본인 권한은 스스로 못 바꾼다(실수로 관리자 잠금 방지).
export const setMemberAdmin = async (actorId: string, targetId: string, isAdmin: boolean) => {
  if (actorId === targetId) return { error: '본인의 관리자 권한은 변경할 수 없습니다.' as const };
  const target = await findUserById(targetId);
  if (!target) return { error: '사용자를 찾을 수 없습니다.' as const };
  const user = await updateUserAdmin(targetId, isAdmin);
  return { user };
};

// 활동 정지/해제. 본인·다른 관리자는 정지할 수 없다(관리자는 먼저 권한을 회수해야 함).
export const setMemberSuspended = async (actorId: string, targetId: string, suspended: boolean) => {
  if (actorId === targetId) return { error: '본인 계정은 정지할 수 없습니다.' as const };
  const target = await findUserById(targetId);
  if (!target) return { error: '사용자를 찾을 수 없습니다.' as const };
  if (suspended && target.isAdmin) {
    return { error: '관리자는 정지할 수 없습니다. 먼저 관리자 권한을 회수하세요.' as const };
  }
  const user = await updateUserSuspended(targetId, suspended);
  return { user };
};

// 회원 삭제(관련 데이터 cascade). 본인·다른 관리자는 삭제할 수 없다.
export const removeMember = async (actorId: string, targetId: string) => {
  if (actorId === targetId) return { error: '본인 계정은 여기서 삭제할 수 없습니다. (설정 > 회원 탈퇴)' as const };
  const target = await findUserById(targetId);
  if (!target) return { error: '사용자를 찾을 수 없습니다.' as const };
  if (target.isAdmin) {
    return { error: '관리자는 삭제할 수 없습니다. 먼저 관리자 권한을 회수하세요.' as const };
  }
  await deleteUserCascade(targetId);
  return { ok: true as const };
};

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
    // 관리자 계정은 이 경로로도 삭제 불가(removeMember와 동일한 보호). 먼저 권한 회수 필요.
    if (u?.isAdmin) return { error: '관리자는 삭제할 수 없습니다. 먼저 관리자 권한을 회수하세요.' as const };
    if (u) await deleteUserCascade(targetId);
  } else {
    return { error: '잘못된 대상입니다.' as const };
  }
  await deleteReportsForTarget(targetType, targetId);
  return { ok: true as const };
};
