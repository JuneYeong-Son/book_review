import { findAllBooks, findInterestsByUser } from '../repository/book_repository.ts';
import { findAllProgress, findProgressByUser } from '../repository/progress_repository.ts';

// 콘텐츠 기반 추천(content-based filtering).
// 사용자가 읽은/관심 책의 genre·category·author feature 가중치를 만들고,
// 아직 안 본 책을 유사도 + 인기도로 점수화해 추천한다.
// (향후 협업 필터링·임베딩 기반으로 확장 가능)

type Feature = Map<string, number>;
const inc = (map: Feature, key: string, weight: number) => {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + weight);
};

export type Recommendation = {
  book: Awaited<ReturnType<typeof findAllBooks>>[number];
  score: number;
  reason: string;
};

export const recommendBooks = async (userId?: string): Promise<Recommendation[]> => {
  const books = await findAllBooks();
  const allProgress = await findAllProgress();

  // 책별 인기도: 읽은 사람 수 + 좋아요 수
  const readers = new Map<string, Set<string>>();
  const likeCount = new Map<string, number>();
  for (const p of allProgress) {
    if (!readers.has(p.bookId)) readers.set(p.bookId, new Set());
    readers.get(p.bookId)!.add(p.userId);
    likeCount.set(p.bookId, (likeCount.get(p.bookId) ?? 0) + (p.likes?.length ?? 0));
  }
  const popularity = (bookId: string) =>
    (readers.get(bookId)?.size ?? 0) + (likeCount.get(bookId) ?? 0) * 2;

  // 비로그인 또는 이력 없음 → 인기순
  const popularFallback = (): Recommendation[] =>
    [...books]
      .sort((a, b) => popularity(b.id) - popularity(a.id))
      .slice(0, 8)
      .map((book) => ({ book, score: popularity(book.id), reason: '인기 도서' }));

  if (!userId) return popularFallback();

  const myProgress = await findProgressByUser(userId);
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
  for (const p of myProgress) {
    seen.add(p.bookId);
    addBook(p.book, 1); // 읽은 책
  }
  for (const it of myInterests) {
    addBook(it.book, 1.5); // 관심 책은 더 높은 가중치
  }
  const excluded = new Set<string>([...seen, ...myInterests.map((i) => i.bookId)]);

  // 프로필이 전혀 없으면 인기순
  if (genreF.size === 0 && categoryF.size === 0 && authorF.size === 0) {
    return popularFallback();
  }

  const scored: Recommendation[] = books
    .filter((book) => !excluded.has(book.id))
    .map((book) => {
      const genreScore = (genreF.get(book.genre) ?? 0) * 2;
      const categoryScore = (categoryF.get(book.category) ?? 0) * 1.5;
      const authorScore = (authorF.get(book.author) ?? 0) * 3;
      const score = genreScore + categoryScore + authorScore + popularity(book.id) * 0.1;

      // 추천 이유: 가장 크게 기여한 feature
      let reason = '취향과 잘 맞아요';
      const top = Math.max(authorScore, genreScore, categoryScore);
      if (top > 0) {
        if (top === authorScore) reason = `${book.author} 작가를 좋아하실 것 같아요`;
        else if (top === genreScore) reason = `'${book.genre}' 장르를 즐겨 읽으시네요`;
        else reason = `'${book.category}' 분야를 좋아하시네요`;
      }
      return { book, score, reason };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // 매칭이 부족하면 인기 도서로 보충
  if (scored.length < 4) {
    const already = new Set(scored.map((r) => r.book.id));
    const fillers = popularFallback().filter(
      (r) => !excluded.has(r.book.id) && !already.has(r.book.id)
    );
    return [...scored, ...fillers].slice(0, 8);
  }

  return scored;
};
