import useSWR from 'swr';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import type { DiscussionSummary, Interest, Notice, Progress } from '@/shared/api/types.ts';

// 여러 화면이 공유하는 SWR 키. 같은 키를 쓰는 컴포넌트끼리는 SWR이 요청을 자동 dedup하고
// 캐시를 공유한다(예: 홈 + QuickActions가 /progress/me·/books/interests/me를 중복 호출하던 문제 해소).
// 변경(작성·삭제) 후에는 `import { mutate } from 'swr'`로 해당 키를 재검증한다.
export const KEY = {
  progressMe: '/progress/me',
  interestsMe: '/books/interests/me',
  discussionsMe: '/discussions/me',
  notices: '/notices'
} as const;

// 로그인 사용자 범위 데이터 — 비로그인 시 key=null이라 요청하지 않는다.
export const useMyProgress = () => {
  const { user } = useAuth();
  return useSWR<Progress[]>(user ? KEY.progressMe : null);
};

export const useMyInterests = () => {
  const { user } = useAuth();
  return useSWR<Interest[]>(user ? KEY.interestsMe : null);
};

export const useMyDiscussions = () => {
  const { user } = useAuth();
  return useSWR<DiscussionSummary[]>(user ? KEY.discussionsMe : null);
};

// 공지사항(로그인 무관).
export const useNotices = () => useSWR<Notice[]>(KEY.notices);
