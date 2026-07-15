import { contentBasedRecommend } from './content_based.ts';
import { popularityBasedRecommend } from './popularity_based.ts';
import { ageGroupBasedRecommend } from './age_group_based.ts';
import type { RecoItem, RecoMethod } from './types.ts';

// 추천 방법 선택:
//  - 'content': 읽었던 책과 비슷한 책 (콘텐츠 기반)
//  - 'popular': 요즘 많이 사는 책
//      · ageGroup 지정 → 우리 플랫폼의 그 연령대 인기 책
//      · 아니면 알라딘 베스트셀러 (categoryId로 장르 필터, start로 페이지네이션)
export const recommend = (
  method: RecoMethod,
  userId?: string,
  options?: { categoryId?: string; ageGroup?: number; start?: number }
): Promise<RecoItem[]> => {
  if (method === 'popular') {
    if (options?.ageGroup) return ageGroupBasedRecommend(options.ageGroup);
    return popularityBasedRecommend(options?.categoryId, options?.start);
  }
  return contentBasedRecommend(userId);
};

export type { RecoItem, RecoMethod } from './types.ts';
