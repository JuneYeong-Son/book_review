import { Router } from 'express';
import { submitReport } from '../service/report_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';

const router = Router();

// 신고하기
router.post('/', requireAuth, async (req, res) => {
  const { targetType, targetId, reason } = req.body ?? {};
  const result = await submitReport(res.locals.userId, targetType, targetId, reason ?? '');
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.status(201).json({ message: '신고가 접수되었습니다.' });
});

export default router;
