import type { Request, Response, NextFunction } from 'express';

// 쿠키의 userId를 검사해 로그인 여부를 확인하는 미들웨어
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.cookies?.userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  res.locals.userId = userId;
  next();
};
