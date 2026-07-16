import { Router } from 'express';
import {
  getStats,
  listReportedPosts,
  deleteReportedPost,
  listAllReviews,
  listMembers,
  setMemberAdmin,
  setMemberSuspended,
  removeMember
} from '../service/admin_service.ts';
import { listFeedback, setFeedbackResolved, removeFeedback } from '../service/feedback_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';
import { requireAdmin } from '../middleware/admin_middleware.ts';

const router = Router();

router.use(requireAuth, requireAdmin);

// 대시보드 통계
router.get('/stats', async (_req, res) => {
  return res.json(await getStats());
});

// 신고된 게시물 목록
router.get('/reports', async (_req, res) => {
  return res.json(await listReportedPosts());
});

// 전체 서평 목록 (신고 여부 무관 관리용)
router.get('/reviews', async (_req, res) => {
  return res.json(await listAllReviews());
});

// 신고된 게시물 삭제
router.delete('/posts/:targetType/:targetId', async (req, res) => {
  const result = await deleteReportedPost(req.params.targetType, req.params.targetId);
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json({ message: '삭제되었습니다.' });
});

// --- 회원 관리 ---

// 전체 회원 목록
router.get('/members', async (_req, res) => {
  return res.json(await listMembers());
});

// 관리자 권한 부여/회수
router.patch('/members/:id/admin', async (req, res) => {
  const result = await setMemberAdmin(res.locals.userId, req.params.id, Boolean(req.body?.isAdmin));
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json({ message: '변경되었습니다.' });
});

// 활동 정지/해제
router.patch('/members/:id/suspend', async (req, res) => {
  const result = await setMemberSuspended(res.locals.userId, req.params.id, Boolean(req.body?.suspended));
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json({ message: '변경되었습니다.' });
});

// 회원 삭제
router.delete('/members/:id', async (req, res) => {
  const result = await removeMember(res.locals.userId, req.params.id);
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json({ message: '삭제되었습니다.' });
});

// --- 피드백/버그 신고 ---

// 피드백 목록
router.get('/feedback', async (_req, res) => {
  return res.json(await listFeedback());
});

// 처리 완료/미완료 토글
router.patch('/feedback/:id/resolve', async (req, res) => {
  await setFeedbackResolved(req.params.id, Boolean(req.body?.resolved));
  return res.json({ message: '변경되었습니다.' });
});

// 피드백 삭제
router.delete('/feedback/:id', async (req, res) => {
  await removeFeedback(req.params.id);
  return res.json({ message: '삭제되었습니다.' });
});

export default router;
