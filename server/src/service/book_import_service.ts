import { findBookByIsbn, findBooksByTitle, createBook } from '../repository/book_repository.ts';

// "헤르만 헤세 (지은이), 전영애 (옮긴이)" → "헤르만 헤세" (옮긴이/역자 등 제거, 지은이만)
const primaryAuthor = (author: string) => {
  const marker = author.indexOf('(지은이)');
  const head = marker >= 0 ? author.slice(0, marker) : author.split(',')[0];
  return head.replace(/\([^)]*\)/g, '').trim();
};

// 표지 URL은 http(s)만 허용. import 시 임의 URL(javascript:, data:, 트래킹 비콘 등)을 걸러낸다.
const safeCoverUrl = (cover: unknown): string => {
  if (typeof cover !== 'string') return '';
  try {
    const u = new URL(cover);
    return u.protocol === 'http:' || u.protocol === 'https:' ? cover : '';
  } catch {
    return '';
  }
};

// 알라딘 OpenAPI 연동. TTB 키는 .env의 ALADIN_TTB_KEY 로 주입.

const ALADIN_SEARCH = 'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
const ALADIN_LIST = 'http://www.aladin.co.kr/ttb/api/ItemList.aspx';

export type BookCandidate = {
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: string;
  isbn: string;
  publisher: string;
  description: string;
};

type AladinItem = {
  title: string;
  author: string;
  cover: string;
  categoryName?: string;
  publisher?: string;
  description?: string;
  isbn13?: string;
  isbn?: string;
};

// "국내도서>소설/시/희곡>고전" → { category: '소설/시/희곡', genre: '고전' }
const parseCategory = (categoryName?: string) => {
  const parts = (categoryName ?? '').split('>').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return { category: '', genre: '' };
  const genre = parts[parts.length - 1];
  const category = parts.length >= 2 ? parts[1] : parts[0];
  return { category, genre };
};

const normalize = (items: AladinItem[]): BookCandidate[] =>
  items.map((item) => {
    const { category, genre } = parseCategory(item.categoryName);
    return {
      title: item.title ?? '',
      author: item.author ?? '',
      cover: item.cover ?? '',
      genre,
      category,
      isbn: item.isbn13 || item.isbn || '',
      publisher: item.publisher ?? '',
      description: item.description ?? ''
    };
  });

// 알라딘 공통 호출
const callAladin = async (endpoint: string, extra: Record<string, string>) => {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) {
    return { error: 'ALADIN_TTB_KEY가 설정되지 않았습니다. server/.env에 키를 넣어주세요.' as const };
  }
  const params = new URLSearchParams({
    ttbkey: key,
    output: 'js',
    Version: '20131101',
    Cover: 'Big',
    SearchTarget: 'Book',
    MaxResults: '10',
    start: '1',
    ...extra
  });
  const response = await fetch(`${endpoint}?${params.toString()}`);
  if (!response.ok) return { error: `알라딘 API 요청 실패 (HTTP ${response.status})` as const };
  const data = (await response.json()) as { item?: AladinItem[]; errorMessage?: string };
  if (data.errorMessage) return { error: `알라딘 오류: ${data.errorMessage}` as const };
  return { candidates: normalize(data.item ?? []) };
};

// 키워드 검색
export const searchExternalBooks = async (query: string) => {
  if (!query.trim()) return { candidates: [] as BookCandidate[] };
  return callAladin(ALADIN_SEARCH, { Query: query, QueryType: 'Keyword' });
};

// 요즘 많이 사는 책 = 알라딘 베스트셀러 (categoryId=장르 필터, start=페이지)
export const fetchBestsellers = async (categoryId?: string, start?: number) =>
  callAladin(ALADIN_LIST, {
    QueryType: 'Bestseller',
    ...(categoryId ? { CategoryId: categoryId } : {}),
    ...(start && start > 1 ? { start: String(start) } : {})
  });

// 후보 하나를 우리 Book 테이블에 저장.
// 중복 판단: ISBN이 같거나, (제목 + 작가(지은이))가 같으면 기존 책으로 취급(옮긴이/판형 무시).
export const importBook = async (candidate: BookCandidate) => {
  const author = primaryAuthor(candidate.author);

  if (candidate.isbn) {
    const existing = await findBookByIsbn(candidate.isbn);
    if (existing) return { book: existing, created: false };
  }
  const sameTitle = await findBooksByTitle(candidate.title);
  const dup = sameTitle.find((b) => primaryAuthor(b.author) === author);
  if (dup) return { book: dup, created: false };

  const book = await createBook({
    title: candidate.title,
    author,
    cover: safeCoverUrl(candidate.cover),
    genre: candidate.genre,
    category: candidate.category,
    isbn: candidate.isbn || null,
    publisher: candidate.publisher,
    description: candidate.description
  });
  return { book, created: true };
};
