import type { Request, Response, NextFunction } from 'express';
import { findUserById } from '../repository/auth_repository.ts';
import { resolveUserId } from '../lib/token.ts';

// 서명된 쿠키(userId) 또는 Authorization: Bearer 토큰으로 로그인 여부를 확인.
// 웹은 쿠키, 네이티브 앱은 토큰을 사용한다. 둘 다 SESSION_SECRET로 서명돼 위조 불가.
// 추가로 계정이 실제로 존재하고 정지되지 않았는지 확인한다(정지된 사용자는 즉시 차단).
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const userId = resolveUserId(req);
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
