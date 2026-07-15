export type User = {
  id: string;
  username: string;
  name: string;
  avatar: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: string;
};

// 추천 결과 (콘텐츠 기반)
export type Recommendation = {
  book: Book;
  score: number;
  reason: string;
};

// 알라딘 검색 결과(아직 저장 전) 후보
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

export type Progress = {
  id: string;
  userId: string;
  bookId: string;
  startPage: number;
  endPage: number;
  note: string;
  quote: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  book: Book;
  user: User;
  likes: { userId: string }[];
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
};

export type Interest = {
  id: string;
  bookId: string;
  book: Book;
};

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: User;
};

export type DiscussionSummary = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  book: Book;
  owner: User;
  _count: { comments: number };
};

export type DiscussionDetail = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  book: Book;
  owner: User;
  comments: Comment[];
};
