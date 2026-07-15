import { fetchBestsellers } from '../service/book_import_service.ts';
import { findBookByIsbn } from '../repository/book_repository.ts';
import type { RecoItem } from './types.ts';

// 요즘 많이 사는 책 = 알라딘 베스트셀러.
// 우리 DB에 이미 있으면 id를 채워(inLibrary=true) 바로 기록/관심 가능하게,
// 없으면 외부 후보(inLibrary=false)로 내려 프론트에서 '추가'할 수 있게 한다.
export const popularityBasedRecommend = async (categoryId?: string): Promise<RecoItem[]> => {
  const result = await fetchBestsellers(categoryId);
  if ('error' in result) return [];

  const items: RecoItem[] = [];
  let rank = 0;
  for (const c of result.candidates) {
    rank += 1;
    const existing = c.isbn ? await findBookByIsbn(c.isbn) : null;
    items.push({
      book: {
        id: existing?.id ?? null,
        title: c.title,
        author: c.author,
        cover: c.cover,
        genre: c.genre,
        category: c.category,
        isbn: c.isbn || null
      },
      reason: `베스트셀러 ${rank}위`,
      inLibrary: Boolean(existing)
    });
  }
  return items;
};
