export type User = {
  id: string;
  username: string;
  name: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: string;
};

export type Progress = {
  id: string;
  userId: string;
  bookId: string;
  page: number;
  note: string;
  rating: number;
  updatedAt: string;
  book: Book;
  user: User;
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
