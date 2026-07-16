export type User = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  birthYear: number | null;
  isAdmin: boolean;
  suspended?: boolean;
};

// 관리자 회원 관리용 목록 항목
export type Member = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  birthYear: number | null;
  isAdmin: boolean;
  suspended: boolean;
  lastSeenAt: string | null;
  createdAt: string;
};

export type AdminStats = {
  members: number;
  todayVisitors: number;
  reportedPosts: number;
};

export type UserProfile = {
  user: { id: string; name: string; avatar: string };
  reviews: Progress[];
  interests: Interest[];
  discussions: DiscussionSummary[];
};

export type Feedback = {
  id: string;
  userId: string | null;
  name: string;
  kind: 'feedback' | 'bug';
  message: string;
  page: string;
  resolved: boolean;
  createdAt: string;
};

export type ReportedPost = {
  targetType: 'review' | 'discussion' | 'user';
  targetId: string;
  count: number;
  title: string;
  author: string;
  snippet: string;
  link: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: string;
  publisher?: string;
  description?: string;
};

// 추천 결과
export type RecoBook = {
  id: string | null; // 우리 DB에 있으면 book id, 없으면 null(외부 후보)
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: string;
  isbn: string | null;
};

export type Recommendation = {
  book: RecoBook;
  reason: string;
  inLibrary: boolean;
};

export type RecoMethod = 'content' | 'popular' | 'cf';

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
  bookSeq: number;
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

export type ReviewDetail = Progress & {
  comments: Comment[];
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
