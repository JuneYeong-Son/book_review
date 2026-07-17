import { findAllBooks, findInterestsByUser, findRecoExclusionIds } from '../repository/book_repository.ts';
import { findAllProgress, findProgressByUser } from '../repository/progress_repository.ts';
import { isExcludedTitle } from './exclusions.ts';
import type { RecoBook, RecoItem } from './types.ts';

// 콘텐츠 기반 추천 (읽었던 책과 비슷한 책).
// 고도화 포인트:
//  - 프로필 가중치를 '별점'으로 반영 (높게 평가한 책의 취향을 더 강하게 학습)
//  - 최근에 읽은 책일수록 가중치 ↑ (recency)
//  - 관심 책은 강한 신호로 별도 가중
//  - genre/category/author feature 유사도 + 플랫폼 인기도 결합

type Feature = Map<string, number>;
const inc = (map: Feature, key: string, weight: number) => {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + weight);
};

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

export const contentBasedRecommend = async (userId?: string): Promise<RecoItem[]> => {
  const exclude = new Set(userId ? await findRecoExclusionIds(userId) : []);
  const books = (await findAllBooks()).filter((b) => !isExcludedTitle(b.title) && !exclude.has(b.id));
  const allProgress = await findAllProgress();

  // 플랫폼 인기도: 읽은 사람 수 + 좋아요 수
  const readers = new Map<string, Set<string>>();
  const likes = new Map<string, number>();
  for (const p of allProgress) {
    if (!readers.has(p.bookId)) readers.set(p.bookId, new Set());
    readers.get(p.bookId)!.add(p.userId);
    likes.set(p.bookId, (likes.get(p.bookId) ?? 0) + (p.likes?.length ?? 0));
  }
  const popularity = (bookId: string) => (readers.get(bookId)?.size ?? 0) + (likes.get(bookId) ?? 0) * 2;

  const popularFallback = (): RecoItem[] =>
    [...books]
      .sort((a, b) => popularity(b.id) - popularity(a.id))
      .slice(0, 8)
      .map((book) => ({ book: toRecoBook(book), reason: '많이 읽고 있는 책', inLibrary: true }));

  if (!userId) return popularFallback();

  const myProgress = await findProgressByUser(userId); // 최신순
  const myInterests = await findInterestsByUser(userId);

  const genreF: Feature = new Map();
  const categoryF: Feature = new Map();
  const authorF: Feature = new Map();
  const addBook = (book: { genre: string; category: string; author: string }, weight: number) => {
    inc(genreF, book.genre, weight);
    inc(categoryF, book.category, weight);
    inc(authorF, book.author, weight);
  };

  const seen = new Set<string>();
  const total = myProgress.length;
  myProgress.forEach((p, index) => {
    seen.add(p.bookId);
    const ratingWeight = Math.max(p.rating, 1); // 별점 가중 (미평가는 1)
    const recencyWeight = total > 0 ? 1 + (total - index) / total : 1; // 최근일수록 ↑
    addBook(p.book, ratingWeight * recencyWeight);
  });
  for (const it of myInterests) {
    addBook(it.book, 4); // 관심 책은 강한 신호
  }

  const excluded = new Set<string>([...seen, ...myInterests.map((i) => i.bookId)]);

  if (genreF.size === 0 && categoryF.size === 0 && authorF.size === 0) {
    return popularFallback();
  }

  const scored: RecoItem[] = books
    .filter((book) => !excluded.has(book.id))
    .map((book) => {
      const genreScore = (genreF.get(book.genre) ?? 0) * 2;
      const categoryScore = (categoryF.get(book.category) ?? 0) * 1.5;
      const authorScore = (authorF.get(book.author) ?? 0) * 3;
      const score = genreScore + categoryScore + authorScore + popularity(book.id) * 0.1;

      let reason = '취향과 잘 맞아요';
      const top = Math.max(authorScore, genreScore, categoryScore);
      if (top > 0) {
        if (top === authorScore) reason = `${book.author} 작가를 좋아하실 것 같아요`;
        else if (top === genreScore) reason = `'${book.genre}' 장르를 즐겨 읽으시네요`;
        else reason = `'${book.category}' 분야를 좋아하시네요`;
      }
      return { book: toRecoBook(book), reason, score, inLibrary: true };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ book, reason, inLibrary }) => ({ book, reason, inLibrary }));

  if (scored.length < 4) {
    const already = new Set(scored.map((r) => r.book.id));
    const fillers = popularFallback().filter((r) => r.book.id && !excluded.has(r.book.id) && !already.has(r.book.id));
    return [...scored, ...fillers].slice(0, 8);
  }

  return scored;
};
