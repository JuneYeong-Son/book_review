import type { Request, Response, NextFunction } from 'express';
import { findUserById } from '../repository/auth_repository.ts';

// 서명된 쿠키의 userId를 검사해 로그인 여부를 확인하는 미들웨어.
// signedCookies는 cookie-parser가 SESSION_SECRET으로 서명을 검증한 값만 담는다(위조 불가).
// 추가로 계정이 실제로 존재하고 정지되지 않았는지 확인한다(정지된 사용자는 즉시 차단).
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.signedCookies?.userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const user = await findUserById(userId);
  if (!user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  if (user.suspended) {
    return res.status(403).json({ message: '활동이 정지된 계정입니다. 관리자에게 문의하세요.' });
  }
  res.locals.userId = userId;
  res.locals.user = user; // 뒤 미들웨어(requireAdmin)가 재조회 없이 재사용
  next();
};
