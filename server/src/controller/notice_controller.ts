import { Router } from 'express';
import { listNotices, createNotice, updateNotice, removeNotice } from '../service/notice_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';
import { requireAdmin } from '../middleware/admin_middleware.ts';

const router = Router();

// 공지 목록 (모두 열람)
router.get('/', async (_req, res) => {
  return res.json(await listNotices());
});

// 이하 관리자 전용
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { title, body, pinned } = req.body ?? {};
  const result = await createNotice({ title, body, pinned });
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.status(201).json(result.notice);
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, body, pinned } = req.body ?? {};
  const result = await updateNotice(req.params.id, { title, body, pinned });
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json(result.notice);
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const result = await removeNotice(req.params.id);
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json({ message: '삭제되었습니다.' });
});

export default router;
