import { Router } from 'express';
import { listBooks, getBook, listInterests, toggleInterest } from '../service/book_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';

const router = Router();

// 전체 책 목록
router.get('/', async (_req, res) => {
  return res.json(await listBooks());
});

// 내 관심 책 목록
router.get('/interests/me', requireAuth, async (_req, res) => {
  return res.json(await listInterests(res.locals.userId));
});

// 책 상세
router.get('/:id', async (req, res) => {
  const book = await getBook(req.params.id);
  if (!book) return res.status(404).json({ message: '책을 찾을 수 없습니다.' });
  return res.json(book);
});

// 관심 책 지정/해제 토글
router.post('/:id/interest', requireAuth, async (req, res) => {
  const result = await toggleInterest(res.locals.userId, req.params.id);
  if (result.error) return res.status(404).json({ message: result.error });
  return res.json(result);
});

export default router;
