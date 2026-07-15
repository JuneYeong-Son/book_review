import { Router } from 'express';
import { getPublicProfile } from '../service/user_service.ts';

const router = Router();

// 공개 유저 프로필
router.get('/:id', async (req, res) => {
  const profile = await getPublicProfile(req.params.id);
  if (!profile) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  return res.json(profile);
});

export default router;
