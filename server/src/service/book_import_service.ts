import { findBookByIsbn, createBook } from '../repository/book_repository.ts';

// 알라딘 OpenAPI 상품 검색으로 책 후보를 가져와 우리 형식으로 정규화한다.
// TTB 키는 .env의 ALADIN_TTB_KEY 로 주입.

const ALADIN_ENDPOINT = 'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx';

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

export const searchExternalBooks = async (query: string) => {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) {
    return { error: 'ALADIN_TTB_KEY가 설정되지 않았습니다. server/.env에 키를 넣어주세요.' as const };
  }
  if (!query.trim()) return { candidates: [] as BookCandidate[] };

  const params = new URLSearchParams({
    ttbkey: key,
    Query: query,
    QueryType: 'Keyword',
    MaxResults: '10',
    start: '1',
    SearchTarget: 'Book',
    Cover: 'Big',
    output: 'js',
    Version: '20131101'
  });

  const response = await fetch(`${ALADIN_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    return { error: `알라딘 API 요청 실패 (HTTP ${response.status})` as const };
  }

  const data = (await response.json()) as { item?: AladinItem[]; errorMessage?: string };
  if (data.errorMessage) {
    return { error: `알라딘 오류: ${data.errorMessage}` as const };
  }

  const candidates: BookCandidate[] = (data.item ?? []).map((item) => {
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

  return { candidates };
};

// 후보 하나를 우리 Book 테이블에 저장 (ISBN 중복 시 기존 책 반환)
export const importBook = async (candidate: BookCandidate) => {
  if (candidate.isbn) {
    const existing = await findBookByIsbn(candidate.isbn);
    if (existing) return { book: existing, created: false };
  }

  const book = await createBook({
    title: candidate.title,
    author: candidate.author,
    cover: candidate.cover,
    genre: candidate.genre,
    category: candidate.category,
    isbn: candidate.isbn || null,
    publisher: candidate.publisher,
    description: candidate.description
  });
  return { book, created: true };
};
