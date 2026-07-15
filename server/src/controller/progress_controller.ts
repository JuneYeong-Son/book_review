import { Router } from 'express';
import {
  listProgress,
  listUserProgress,
  listUserBookProgress,
  listBookProgress,
  getProgressDetail,
  getProgressByBookSeq,
  saveProgress,
  toggleLike,
  addReviewComment,
  editReview,
  removeReview
} from '../service/progress_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';

const router = Router();

// 모든 사용자의 독서 기록 (skip/take로 페이지네이션)
router.get('/', async (req, res) => {
  const skip = req.query.skip ? Number(req.query.skip) : undefined;
  const take = req.query.take ? Number(req.query.take) : undefined;
  return res.json(await listProgress(skip, take));
});

// 내 독서 기록 전체
router.get('/me', requireAuth, async (_req, res) => {
  return res.json(await listUserProgress(res.locals.userId));
});

// 한 책에 대해 내가 남긴 기록들 (날짜별) — '/me'보다 구체적 경로
router.get('/me/book/:bookId', requireAuth, async (req, res) => {
  return res.json(await listUserBookProgress(res.locals.userId, req.params.bookId));
});

// 한 책에 대한 모든 사용자의 서평
router.get('/book/:bookId', async (req, res) => {
  return res.json(await listBookProgress(req.params.bookId));
});

// 책별 순번으로 서평 상세 (URL /books/:bookId/reviews/:seq 용)
router.get('/book/:bookId/seq/:seq', async (req, res) => {
  const detail = await getProgressByBookSeq(req.params.bookId, Number(req.params.seq));
  if (!detail) return res.status(404).json({ message: '서평을 찾을 수 없습니다.' });
  return res.json(detail);
});

// 서평 상세 (댓글 포함) — '/:id'는 구체적 경로들보다 뒤에
router.get('/:id', async (req, res) => {
  const detail = await getProgressDetail(req.params.id);
  if (!detail) return res.status(404).json({ message: '서평을 찾을 수 없습니다.' });
  return res.json(detail);
});

// 오늘 무슨 책을 몇 페이지부터 몇 페이지까지 읽었는지 + 서평/별점/글귀 기록 (매번 새 항목)
router.post('/', requireAuth, async (req, res) => {
  const { bookId, startPage, endPage, note, quote, rating } = req.body ?? {};
  if (!bookId || typeof startPage !== 'number' || typeof endPage !== 'number') {
    return res.status(400).json({ message: '책과 시작·끝 페이지를 올바르게 입력하세요.' });
  }

  const result = await saveProgress({
    userId: res.locals.userId,
    bookId,
    startPage,
    endPage,
    note: note ?? '',
    quote: quote ?? '',
    rating: typeof rating === 'number' ? rating : 0
  });
  if (result.error) return res.status(400).json({ message: result.error });
  return res.status(201).json(result.record);
});

// 서평 수정 (본인)
router.patch('/:id', requireAuth, async (req, res) => {
  const { startPage, endPage, note, quote, rating } = req.body ?? {};
  const fields: Record<string, unknown> = {};
  if (typeof startPage === 'number') fields.startPage = startPage;
  if (typeof endPage === 'number') fields.endPage = endPage;
  if (typeof note === 'string') fields.note = note;
  if (typeof quote === 'string') fields.quote = quote;
  if (typeof rating === 'number') fields.rating = rating;
  const result = await editReview(res.locals.userId, req.params.id, fields);
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json(result.record);
});

// 서평 삭제 (본인)
router.delete('/:id', requireAuth, async (req, res) => {
  const result = await removeReview(res.locals.userId, req.params.id);
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json({ message: '삭제되었습니다.' });
});

// 서평 좋아요 토글
router.post('/:id/like', requireAuth, async (req, res) => {
  const result = await toggleLike(res.locals.userId, req.params.id);
  if ('error' in result) return res.status(404).json({ message: result.error });
  return res.json(result);
});

// 서평에 댓글 달기
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { text } = req.body ?? {};
  if (!text) return res.status(400).json({ message: '댓글 내용을 입력하세요.' });
  const result = await addReviewComment(req.params.id, res.locals.userId, text);
  if ('error' in result) return res.status(404).json({ message: result.error });
  return res.status(201).json(result.comment);
});

export default router;
