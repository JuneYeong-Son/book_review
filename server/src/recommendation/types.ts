// 추천 결과 공통 타입 (전략들이 동일한 형태로 반환)

export type RecoBook = {
  id: string | null; // 우리 DB에 있으면 book id, 없으면 null(외부 후보)
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: string;
  isbn: string | null;
};

export type RecoItem = {
  book: RecoBook;
  reason: string;
  inLibrary: boolean; // 우리 DB에 이미 있는 책인지
};

export type RecoMethod = 'content' | 'popular' | 'cf';
