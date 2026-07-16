import { Router } from 'express';
import { getStats, listReportedPosts, deleteReportedPost, listAllReviews } from '../service/admin_service.ts';
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

export default router;
