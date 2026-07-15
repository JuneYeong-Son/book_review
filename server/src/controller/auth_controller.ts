import { Router } from 'express';
import { loginUser, registerUser, getUser } from '../service/auth_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';

const router = Router();

// 회원가입
router.post('/register', async (req, res) => {
  const { username, name, password } = req.body ?? {};
  if (!username || !name || !password) {
    return res.status(400).json({ message: '아이디, 이름, 비밀번호를 모두 입력하세요.' });
  }

  const result = await registerUser(username, name, password);
  if (result.error) return res.status(409).json({ message: result.error });

  res.cookie('userId', result.user.id, { httpOnly: true, sameSite: 'lax' });
  return res.status(201).json(result.user);
});

// 로그인
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  const user = await loginUser(username, password);
  if (!user) return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });

  res.cookie('userId', user.id, { httpOnly: true, sameSite: 'lax' });
  return res.json(user);
});

// 로그아웃
router.post('/logout', (_req, res) => {
  res.clearCookie('userId');
  return res.json({ message: '로그아웃 되었습니다.' });
});

// 현재 로그인 사용자 정보
router.get('/me', requireAuth, async (_req, res) => {
  const user = await getUser(res.locals.userId);
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  return res.json(user);
});

export default router;
