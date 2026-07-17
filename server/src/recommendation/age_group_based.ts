import { findProgressWithUserAge } from '../repository/progress_repository.ts';
import { isExcludedTitle } from './exclusions.ts';
import type { RecoBook, RecoItem } from './types.ts';

// 연령대별 인기 추천 (우리 플랫폼 자체 데이터).
// 같은 연령대 사용자들이 많이 읽고 좋아요한 책을 집계해 추천한다.
// ageGroup: 10,20,30,40 = 해당 연령대 / 50 = 50대 이상

const toRecoBook = (book: {
  id: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: string;
  isbn: string | null;
}): RecoBook => ({
  id: book.id,
  title: book.title,
  author: book.author,
  cover: book.cover,
  genre: book.genre,
  category: book.category,
  isbn: book.isbn
});

export const ageGroupBasedRecommend = async (ageGroup: number): Promise<RecoItem[]> => {
  const rows = await findProgressWithUserAge();
  const currentYear = new Date().getFullYear();

  const inGroup = (birthYear: number | null) => {
    if (!birthYear) return false;
    const age = currentYear - birthYear;
    if (age < 0 || age > 120) return false;
    if (ageGroup >= 50) return age >= 50;
    return age >= ageGroup && age < ageGroup + 10;
  };

  // 책별 점수: 해당 연령대의 (읽은 사람 수) + (좋아요 수)
  type Agg = { book: RecoBook; readers: Set<string>; likes: number };
  const agg = new Map<string, Agg>();
  for (const row of rows) {
    if (!inGroup(row.user.birthYear)) continue;
    if (isExcludedTitle(row.book.title)) continue;
    if (!agg.has(row.bookId)) {
      agg.set(row.bookId, { book: toRecoBook(row.book), readers: new Set(), likes: 0 });
    }
    const e = agg.get(row.bookId)!;
    e.readers.add(row.userId);
    e.likes += row.likes?.length ?? 0;
  }

  const label = ageGroup >= 50 ? '50대 이상' : `${ageGroup}대`;
  return [...agg.values()]
    .map((e) => ({ e, score: e.readers.size + e.likes * 2 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ e }) => ({
      book: e.book,
      reason: `${label}가 많이 읽는 책`,
      inLibrary: true
    }));
};
