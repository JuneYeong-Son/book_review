import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authController from './controller/auth_controller.ts';
import bookController from './controller/book_controller.ts';
import progressController from './controller/progress_controller.ts';
import discussionController from './controller/discussion_controller.ts';
import notificationController from './controller/notification_controller.ts';
import reportController from './controller/report_controller.ts';
import adminController from './controller/admin_controller.ts';
import userController from './controller/user_controller.ts';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// 배포 시 프론트 주소를 FRONTEND_URL 환경변수로 지정 (없으면 로컬 Vite)
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.set('trust proxy', 1); // Render 등 프록시 뒤에서 secure 쿠키 동작
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authController);
app.use('/api/books', bookController);
app.use('/api/progress', progressController);
app.use('/api/discussions', discussionController);
app.use('/api/notifications', notificationController);
app.use('/api/reports', reportController);
app.use('/api/admin', adminController);
app.use('/api/users', userController);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
