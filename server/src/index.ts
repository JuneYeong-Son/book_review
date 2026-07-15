import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authController from './controller/auth_controller.ts';
import bookController from './controller/book_controller.ts';
import progressController from './controller/progress_controller.ts';
import discussionController from './controller/discussion_controller.ts';
import notificationController from './controller/notification_controller.ts';

const app = express();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authController);
app.use('/api/books', bookController);
app.use('/api/progress', progressController);
app.use('/api/discussions', discussionController);
app.use('/api/notifications', notificationController);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
