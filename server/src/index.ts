import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { SESSION_SECRET } from './lib/cookie.ts';
import { ensureAdmins } from './lib/bootstrap.ts';
import authController from './controller/auth_controller.ts';
import bookController from './controller/book_controller.ts';
import progressController from './controller/progress_controller.ts';
import discussionController from './controller/discussion_controller.ts';
import notificationController from './controller/notification_controller.ts';
import reportController from './controller/report_controller.ts';
import adminController from './controller/admin_controller.ts';
import userController from './controller/user_controller.ts';
import feedbackController from './controller/feedback_controller.ts';
import noticeController from './controller/notice_controller.ts';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// 배포 시 프론트 주소를 FRONTEND_URL 환경변수로 지정 (없으면 로컬 Vite)
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.set('trust proxy', 1); // Render 등 프록시 뒤에서 secure 쿠키 동작
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET)); // 시크릿을 줘야 signed 쿠키(위조 방지)가 동작

// 기본 보안 헤더(helmet 대체 최소 세트). API 응답에 적용.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
});

// CSRF 간이 방어: 상태 변경 요청은 커스텀 헤더를 요구한다.
// 커스텀 헤더는 교차출처 <form>/단순요청으로 붙일 수 없고, 이를 붙인 요청은
// 프리플라이트가 필요해 CORS allowlist가 교차출처를 차단한다. (프론트 client.ts가 헤더를 붙임)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  if (req.get('X-Requested-With') !== 'book-review') {
    return res.status(403).json({ message: '요청이 거부되었습니다.' });
  }
  next();
});

app.use('/api/auth', authController);
app.use('/api/books', bookController);
app.use('/api/progress', progressController);
app.use('/api/discussions', discussionController);
app.use('/api/notifications', notificationController);
app.use('/api/reports', reportController);
app.use('/api/admin', adminController);
app.use('/api/users', userController);
app.use('/api/feedback', feedbackController);
app.use('/api/notices', noticeController);

app.listen(PORT, async () => {
  await ensureAdmins(); // 관리자 플래그 보장(재배포 시 seed 건너뛰어도 유지)
  console.log(`Server listening on http://localhost:${PORT}`);
});
