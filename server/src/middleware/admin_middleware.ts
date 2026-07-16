import type { Request, Response, NextFunction } from 'express';
import { findUserById } from '../repository/auth_repository.ts';

// requireAuth 다음에 사용. 관리자만 통과.
// 관리자 여부는 서버가 통제하는 User.isAdmin 컬럼으로 판정한다(유저명 매칭 폐기 — 가입으로 위장 불가).
export const requireAdmin = async (_req: Request, res: Response, next: NextFunction) => {
  const user = await findUserById(res.locals.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
  }
  next();
};
