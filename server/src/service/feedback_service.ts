import {
  insertFeedback,
  findAllFeedback,
  updateFeedbackResolved,
  deleteFeedbackById
} from '../repository/feedback_repository.ts';
import { findUserById } from '../repository/auth_repository.ts';

const MAX_LEN = 2000;

// 피드백 제출. 비로그인도 가능(userId 없으면 '익명').
export const submitFeedback = async (input: { userId: string | null; kind: string; message: string; page: string }) => {
  const message = input.message.trim();
  if (message.length < 5) return { error: '조금 더 자세히 적어주세요. (5자 이상)' as const };
  if (message.length > MAX_LEN) return { error: '내용이 너무 깁니다.' as const };

  let name = '익명';
  if (input.userId) {
    const user = await findUserById(input.userId);
    if (user) name = user.name;
  }
  const kind = input.kind === 'bug' ? 'bug' : 'feedback';
  const feedback = await insertFeedback({ userId: input.userId, name, kind, message, page: input.page });
  return { feedback };
};

export const listFeedback = () => findAllFeedback();

export const setFeedbackResolved = (id: string, resolved: boolean) => updateFeedbackResolved(id, resolved);

export const removeFeedback = (id: string) => deleteFeedbackById(id);
