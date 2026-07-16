import { Router } from 'express';
import { submitFeedback } from '../service/feedback_service.ts';
import { makeRateLimiter } from '../lib/rate_limit.ts';
import { resolveUserId } from '../lib/token.ts';

const router = Router();

// 스팸 억제: IP당 10분에 5회
const feedbackLimiter = makeRateLimiter(10 * 60 * 1000, 5);

// 피드백/버그 신고 제출 — 로그인 없이도 가능(로그인 상태면 작성자 이름 기록)
router.post('/', feedbackLimiter, async (req, res) => {
  const { kind, message, page } = req.body ?? {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ message: '내용을 입력하세요.' });
  }
  // 로그인 상태면 쿠키(웹) 또는 토큰(앱)에서 사용자 식별(선택)
  const userId = resolveUserId(req);
  const result = await submitFeedback({
    userId,
    kind: typeof kind === 'string' ? kind : 'feedback',
    message,
    page: typeof page === 'string' ? page : ''
  });
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.status(201).json({ message: '소중한 의견 감사합니다!' });
});

export default router;
