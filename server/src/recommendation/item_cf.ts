import { findAllBooks, findRecoExclusionIds } from '../repository/book_repository.ts';
import { findAllProgress } from '../repository/progress_repository.ts';
import { contentBasedRecommend } from './content_based.ts';
import { isExcludedTitle } from './exclusions.ts';
import type { RecoBook, RecoItem } from './types.ts';

// 아이템 기반 협업 필터링 (item-based collaborative filtering).
//
// 1) 상호작용 행렬: 책 × (그 책을 읽거나 좋아요한 사용자)
// 2) 아이템(책) 유사도 = 두 책을 함께 소비한 사용자 기반 코사인 유사도
//      sim(i, j) = |users(i) ∩ users(j)| / (√|users(i)| · √|users(j)|)
// 3) 타깃 사용자가 본 책들과 유사한(안 본) 책을 점수 합산해 추천
//
// 데이터가 희소하면(공통 사용자 없음) 인기순으로 보충한다.

const toRecoBook = (b: {
  id: string; title: string; author: string; cover: string;
  genre: string; category: string; isbn: string | null;
}): RecoBook => ({
  id: b.id, title: b.title, author: b.author, cover: b.cover,
  genre: b.genre, category: b.category, isbn: b.isbn
});

export const itemCfRecommend = async (userId?: string): Promise<RecoItem[]> => {
  const exclude = new Set(userId ? await findRecoExclusionIds(userId) : []);
  const books = (await findAllBooks()).filter(
    (b) => !isExcludedTitle(b.title) && !exclude.has(b.id)
  );
  const progress = await findAllProgress();

  // 책별 상호작용 사용자 집합 (읽음 + 좋아요), 사용자별 소비한 책 집합
  const bookUsers = new Map<string, Set<string>>();
  const userBooks = new Map<string, Set<string>>();
  const link = (bookId: string, uid: string) => {
    if (!bookUsers.has(bookId)) bookUsers.set(bookId, new Set());
    bookUsers.get(bookId)!.add(uid);
    if (!userBooks.has(uid)) userBooks.set(uid, new Set());
    userBooks.get(uid)!.add(bookId);
  };
  for (const p of progress) {
    link(p.bookId, p.userId);
    for (const l of p.likes ?? []) link(p.bookId, l.userId);
  }

  const popularity = (bookId: string) => bookUsers.get(bookId)?.size ?? 0;
  const popularFallback = (exclude: Set<string>): RecoItem[] =>
    [...books]
      .filter((b) => !exclude.has(b.id))
      .sort((a, b) => popularity(b.id) - popularity(a.id))
      .map((b) => ({ book: toRecoBook(b), reason: '많이 읽고 있는 책', inLibrary: true }));

  // 비로그인 또는 이력 없음 → 인기순
  const mine = userId ? userBooks.get(userId) ?? new Set<string>() : new Set<string>();
  if (mine.size === 0) return popularFallback(new Set()).slice(0, 8);

  // 코사인 유사도
  const cosine = (a: string, b: string) => {
    const ua = bookUsers.get(a);
    const ub = bookUsers.get(b);
    if (!ua || !ub) return 0;
    const [small, large] = ua.size < ub.size ? [ua, ub] : [ub, ua];
    let inter = 0;
    for (const u of small) if (large.has(u)) inter += 1;
    if (inter === 0) return 0;
    return inter / (Math.sqrt(ua.size) * Math.sqrt(ub.size));
  };

  const scored: RecoItem[] = books
    .filter((b) => !mine.has(b.id))
    .map((b) => {
      let score = 0;
      for (const i of mine) score += cosine(b.id, i);
      return { book: b, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => ({
      book: toRecoBook(x.book),
      reason: '비슷한 취향의 독자들이 함께 읽은 책',
      inLibrary: true
    }));

  // 협업 신호가 부족하면 콘텐츠 기반(장르·작가 유사도)으로 보충
  if (scored.length < 4) {
    const already = new Set<string>([...mine, ...scored.map((r) => r.book.id!)]);
    const content = (await contentBasedRecommend(userId)).filter(
      (r) => r.book.id && !already.has(r.book.id)
    );
    const merged = [...scored, ...content];
    return merged.length > 0 ? merged.slice(0, 8) : popularFallback(mine).slice(0, 8);
  }
  return scored;
};
