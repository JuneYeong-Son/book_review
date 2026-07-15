import { contentBasedRecommend } from './content_based.ts';
import { popularityBasedRecommend } from './popularity_based.ts';
import type { RecoItem, RecoMethod } from './types.ts';

// 추천 방법 선택:
//  - 'content': 읽었던 책과 비슷한 책 (콘텐츠 기반)
//  - 'popular': 요즘 많이 사는 책 (알라딘 베스트셀러, categoryId로 장르 필터)
export const recommend = (
  method: RecoMethod,
  userId?: string,
  options?: { categoryId?: string }
): Promise<RecoItem[]> =>
  method === 'popular'
    ? popularityBasedRecommend(options?.categoryId)
    : contentBasedRecommend(userId);

export type { RecoItem, RecoMethod } from './types.ts';
