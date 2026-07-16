import { Router } from 'express';
import {
  listDiscussions,
  listMyDiscussions,
  getDiscussion,
  openDiscussion,
  addComment
} from '../service/discussion_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';

const router = Router();

// 토론 목록 (skip/take로 페이지네이션, bookId로 특정 책 토론만 스코프)
router.get('/', async (req, res) => {
  const skip = req.query.skip ? Number(req.query.skip) : undefined;
  const take = req.query.take ? Number(req.query.take) : undefined;
  const bookId = typeof req.query.bookId === 'string' ? req.query.bookId : undefined;
  return res.json(await listDiscussions(skip, take, bookId));
});

// 내가 참여한 토론 (':id'보다 먼저 등록해야 'me'가 id로 잡히지 않음)
router.get('/me', requireAuth, async (_req, res) => {
  return res.json(await listMyDiscussions(res.locals.userId));
});

// 토론 상세 (댓글 포함)
router.get('/:id', async (req, res) => {
  const discussion = await getDiscussion(req.params.id);
  if (!discussion) return res.status(404).json({ message: '토론을 찾을 수 없습니다.' });
  return res.json(discussion);
});

// 토론 열기 (자신이 읽거나 읽는 중인 책만 가능)
router.post('/', requireAuth, async (req, res) => {
  const { bookId, title, description } = req.body ?? {};
  if (!bookId || !title) {
    return res.status(400).json({ message: '책과 제목을 입력하세요.' });
  }

  const result = await openDiscussion(res.locals.userId, bookId, title, description ?? '');
  if (result.error) return res.status(403).json({ message: result.error });
  return res.status(201).json(result.discussion);
});

// 댓글 달기 (로그인한 누구나 참여 가능)
router.post('/:id/comments', requireAuth, async (req, res) => {
  const { text } = req.body ?? {};
  if (!text) return res.status(400).json({ message: '댓글 내용을 입력하세요.' });

  const result = await addComment(req.params.id, res.locals.userId, text);
  if (result.error) return res.status(404).json({ message: result.error });
  return res.status(201).json(result.comment);
});

export default router;
