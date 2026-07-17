import { Router } from 'express';
import { listNotifications, readNotification, readAllNotifications } from '../service/notification_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';

const router = Router();

// 내 알림 목록
router.get('/', requireAuth, async (_req, res) => {
  return res.json(await listNotifications(res.locals.userId));
});

// 알림 하나 읽음 처리
router.post('/:id/read', requireAuth, async (req, res) => {
  await readNotification(req.params.id, res.locals.userId);
  return res.json({ ok: true });
});

// 전체 읽음 처리
router.post('/read-all', requireAuth, async (_req, res) => {
  await readAllNotifications(res.locals.userId);
  return res.json({ ok: true });
});

export default router;
