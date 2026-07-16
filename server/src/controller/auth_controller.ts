import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginUser,
  startRegistration,
  verifyRegistration,
  checkNickname,
  checkEmail,
  getUser,
  updateProfile,
  changePassword,
  deleteAccount
} from '../service/auth_service.ts';
import { kakaoAuthorizeUrl, loginWithKakao } from '../service/oauth_service.ts';
import { requireAuth } from '../middleware/auth_middleware.ts';
import { authCookieOptions } from '../lib/cookie.ts';
import type { Request } from 'express';

// 콜백 Redirect URI는 현재 요청 호스트에서 구성(로컬/배포 동일 코드, 카카오 등록값과 일치해야 함)
const kakaoRedirectUri = (req: Request) => `${req.protocol}://${req.get('host')}/api/auth/oauth/kakao/callback`;
const frontendUrl = () => (process.env.FRONTEND_URL ?? 'http://localhost:5173').split(',')[0].trim();

const router = Router();

// 인증 엔드포인트 레이트리밋: IP당 15분에 20회 (무차별 대입·유저명 열거 억제)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' }
});

// 회원가입 1단계: 정보 제출 → 인증 메일 발송
router.post('/register/start', authLimiter, async (req, res) => {
  const { username, email, name, nickname, phone, password, avatar, birthYear, agreed } = req.body ?? {};
  if (!username || !email || !name || !nickname || !phone || !password) {
    return res.status(400).json({ message: '아이디, 이메일, 이름, 닉네임, 휴대폰 번호, 비밀번호를 모두 입력하세요.' });
  }
  const result = await startRegistration({
    username, email, name, nickname,
    phone: String(phone),
    password,
    avatar: avatar ?? '📚',
    birthYear: typeof birthYear === 'number' ? birthYear : null,
    agreed: agreed === true
  });
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.status(200).json({ ok: true, dev: result.dev, devCode: result.devCode });
});

// 회원가입 2단계: 인증 코드 확인 → 가입 확정
router.post('/register/verify', authLimiter, async (req, res) => {
  const { email, code } = req.body ?? {};
  if (!email || !code) return res.status(400).json({ message: '이메일과 인증 코드를 입력하세요.' });
  const result = await verifyRegistration(email, String(code));
  if ('error' in result) return res.status(400).json({ message: result.error });
  res.cookie('userId', result.user.id, authCookieOptions);
  return res.status(201).json(result.user);
});

// 닉네임 / 이메일 사용 가능 여부 확인 (실시간 중복 체크)
router.get('/check/nickname', async (req, res) => {
  const value = String(req.query.value ?? '');
  const error = await checkNickname(value);
  return res.json({ available: error === null, message: error });
});
router.get('/check/email', async (req, res) => {
  const value = String(req.query.value ?? '');
  const error = await checkEmail(value);
  return res.json({ available: error === null, message: error });
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

// --- 소셜 로그인 (카카오) ---
// 1) 카카오 동의 화면으로 리다이렉트
router.get('/oauth/kakao', (req, res) => {
  const url = kakaoAuthorizeUrl(kakaoRedirectUri(req));
  if (!url) return res.redirect(`${frontendUrl()}/login?error=oauth_unconfigured`);
  return res.redirect(url);
});

// 2) 카카오 콜백 → 로그인/가입 → 세션 쿠키 → 프론트로 복귀
router.get('/oauth/kakao/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!code) return res.redirect(`${frontendUrl()}/login?error=oauth`);
  const result = await loginWithKakao(code, kakaoRedirectUri(req));
  if ('error' in result) {
    const reason = result.error === 'suspended' ? 'suspended' : 'oauth';
    return res.redirect(`${frontendUrl()}/login?error=${reason}`);
  }
  res.cookie('userId', result.user.id, authCookieOptions);
  return res.redirect(`${frontendUrl()}/`);
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

// 프로필(이름·닉네임·아바타·출생연도) 수정
router.patch('/me', requireAuth, async (req, res) => {
  const { name, nickname, avatar, birthYear } = req.body ?? {};
  const by = birthYear === null ? null : typeof birthYear === 'number' ? birthYear : undefined;
  const result = await updateProfile(res.locals.userId, {
    name, avatar, birthYear: by,
    nickname: typeof nickname === 'string' ? nickname : undefined
  });
  if ('error' in result) return res.status(400).json({ message: result.error });
  return res.json(result.user);
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
