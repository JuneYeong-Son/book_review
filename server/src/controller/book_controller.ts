import { Router } from 'express';
import { listBooks, getBook, listInterests, toggleInterest } from '../service/book_service.ts';
import { searchExternalBooks, importBook } from '../service/book_import_service.ts';
import { recommend } from '../recommendation/index.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';

const router = Router();

// 전체 책 목록
router.get('/', async (_req, res) => {
  return res.json(await listBooks());
});

// 추천 — method=content(읽은 책과 비슷) | popular(요즘 많이 사는 책), categoryId=장르 필터
router.get('/recommendations', async (req, res) => {
  const userId = req.cookies?.userId as string | undefined;
  const method = req.query.method === 'popular' ? 'popular' : 'content';
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  return res.json(await recommend(method, userId, { categoryId }));
});

// 알라딘에서 책 검색 (아직 저장 전 후보 목록)
router.get('/search/external', requireAuth, async (req, res) => {
  const query = String(req.query.q ?? '');
  const result = await searchExternalBooks(query);
  if ('error' in result) return res.status(502).json({ message: result.error });
  return res.json(result.candidates);
});

// 검색 결과 중 하나를 우리 DB에 추가
router.post('/import', requireAuth, async (req, res) => {
  const candidate = req.body ?? {};
  if (!candidate.title) return res.status(400).json({ message: '책 정보가 올바르지 않습니다.' });
  const { book, created } = await importBook(candidate);
  return res.status(created ? 201 : 200).json(book);
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
