import { findUserById } from '../repository/auth_repository.ts';
import { findProgressByUser } from '../repository/progress_repository.ts';
import { findInterestsByUser } from '../repository/book_repository.ts';
import { findDiscussionsByParticipant } from '../repository/discussion_repository.ts';

// 공개 프로필: 유저 정보 + 서평 + 서재(관심 책) + 참여한 토론
export const getPublicProfile = async (id: string) => {
  const user = await findUserById(id);
  if (!user) return null;

  const [reviews, interests, discussions] = await Promise.all([
    findProgressByUser(id),
    findInterestsByUser(id),
    findDiscussionsByParticipant(id)
  ]);

  return {
    user: { id: user.id, name: user.name, nickname: user.nickname, avatar: user.avatar },
    reviews,
    interests,
    discussions
  };
};
