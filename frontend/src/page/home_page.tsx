import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/client.ts';
import type { Book, Interest, Progress } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import BookCard from '../component/book_card.tsx';

const HomePage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [myProgress, setMyProgress] = useState<Progress[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);

  const loadBooks = () => apiGet<Book[]>('/books').then(setBooks);

  const loadMine = () => {
    if (!user) {
      setMyProgress([]);
      setInterests([]);
      return;
    }
    apiGet<Progress[]>('/progress/me').then(setMyProgress).catch(() => setMyProgress([]));
    apiGet<Interest[]>('/books/interests/me').then(setInterests).catch(() => setInterests([]));
  };

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    loadMine();
  }, [user]);

  const interestedIds = new Set(interests.map((i) => i.bookId));
  // myProgress는 최신순 → 책별 첫 항목이 최신 기록
  const latestByBook = new Map<string, Progress>();
  for (const record of myProgress) {
    if (!latestByBook.has(record.bookId)) latestByBook.set(record.bookId, record);
  }

  const handleToggleInterest = async (bookId: string) => {
    await apiPost(`/books/${bookId}/interest`);
    loadMine();
  };

  const handleSaveProgress = async (
    bookId: string,
    startPage: number,
    endPage: number,
    note: string,
    quote: string,
    rating: number
  ) => {
    await apiPost('/progress', { bookId, startPage, endPage, note, quote, rating });
    loadMine();
  };

  return (
    <section>
      <div className="page-head">
        <h1>책 둘러보기</h1>
        <p className="muted">
          {user ? '읽은 만큼 기록하고 별점과 서평을 남겨보세요.' : '로그인하면 독서 기록과 서평을 남길 수 있어요.'}
        </p>
      </div>

      <div className="book-grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            latest={latestByBook.get(book.id)}
            interested={interestedIds.has(book.id)}
            loggedIn={Boolean(user)}
            onToggleInterest={handleToggleInterest}
            onSaveProgress={handleSaveProgress}
          />
        ))}
      </div>
    </section>
  );
};

export default HomePage;
