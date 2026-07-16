import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginUser,
  registerUser,
  getUser,
  updateProfile,
  changePassword,
  deleteAccount,
  validatePassword
} from '../service/auth_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';
import { authCookieOptions } from '../lib/cookie.ts';

const router = Router();

// 인증 엔드포인트 레이트리밋: IP당 15분에 20회 (무차별 대입·유저명 열거 억제)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' }
});

// 회원가입
router.post('/register', authLimiter, async (req, res) => {
  const { username, name, password, avatar, birthYear } = req.body ?? {};
  if (!username || !name || !password) {
    return res.status(400).json({ message: '아이디, 이름, 비밀번호를 모두 입력하세요.' });
  }
  const weak = validatePassword(password);
  if (weak) return res.status(400).json({ message: weak });

  const result = await registerUser(
    username, name, password, avatar ?? '📚',
    typeof birthYear === 'number' ? birthYear : null
  );
  if (result.error) return res.status(409).json({ message: result.error });

  res.cookie('userId', result.user.id, authCookieOptions);
  return res.status(201).json(result.user);
});

// 로그인
router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};
  const result = await loginUser(username, password);
  if ('error' in result) {
    if (result.error === 'suspended') {
      return res.status(403).json({ message: '활동이 정지된 계정입니다. 관리자에게 문의하세요.' });
    }
    return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  res.cookie('userId', result.user.id, authCookieOptions);
  return res.json(result.user);
});

// 로그아웃
router.post('/logout', (_req, res) => {
  res.clearCookie('userId', authCookieOptions);
  return res.json({ message: '로그아웃 되었습니다.' });
});

// 현재 로그인 사용자 정보
router.get('/me', requireAuth, async (_req, res) => {
  const user = await getUser(res.locals.userId);
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  return res.json(user);
});

// 프로필(이름·아바타·출생연도) 수정
router.patch('/me', requireAuth, async (req, res) => {
  const { name, avatar, birthYear } = req.body ?? {};
  const by = birthYear === null ? null : typeof birthYear === 'number' ? birthYear : undefined;
  const user = await updateProfile(res.locals.userId, name, avatar, by);
  return res.json(user);
});

// 비밀번호 변경
router.post('/change-password', authLimiter, requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '현재/새 비밀번호를 입력하세요.' });
  }
  const result = await changePassword(res.locals.userId, currentPassword, newPassword);
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json({ message: '비밀번호가 변경되었습니다.' });
});

// 회원 탈퇴
router.delete('/me', requireAuth, async (req, res) => {
  const { password } = req.body ?? {};
  if (!password) return res.status(400).json({ message: '비밀번호를 입력하세요.' });
  const result = await deleteAccount(res.locals.userId, password);
  if ('error' in result) return res.status(400).json({ message: result.error });
  res.clearCookie('userId', authCookieOptions);
  return res.json({ message: '회원 탈퇴가 완료되었습니다.' });
});

export default router;
