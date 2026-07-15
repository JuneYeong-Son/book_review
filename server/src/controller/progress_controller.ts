import { Router } from 'express';
import { listProgress, listUserProgress, saveProgress } from '../service/progress_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';

const router = Router();

// 모든 사용자의 독서 기록 (다른 사람 기록도 볼 수 있음)
router.get('/', async (_req, res) => {
  return res.json(await listProgress());
});

// 내 독서 기록
router.get('/me', requireAuth, async (_req, res) => {
  return res.json(await listUserProgress(res.locals.userId));
});

// 오늘 무슨 책을 어디까지 읽었는지 + 서평/별점 기록/갱신
router.post('/', requireAuth, async (req, res) => {
  const { bookId, page, note, rating } = req.body ?? {};
  if (!bookId || typeof page !== 'number') {
    return res.status(400).json({ message: '책과 페이지를 올바르게 입력하세요.' });
  }

  const result = await saveProgress(
    res.locals.userId,
    bookId,
    page,
    note ?? '',
    typeof rating === 'number' ? rating : 0
  );
  if (result.error) return res.status(400).json({ message: result.error });
  return res.json(result.record);
});

export default router;
