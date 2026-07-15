import type { Request, Response, NextFunction } from 'express';
import { findUserById } from '../repository/auth_repository.ts';
import { isAdminUsername } from '../lib/admin.ts';

// requireAuth 다음에 사용. 관리자만 통과.
export const requireAdmin = async (_req: Request, res: Response, next: NextFunction) => {
  const user = await findUserById(res.locals.userId);
  if (!user || !isAdminUsername(user.username)) {
    return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
  }
  next();
};
