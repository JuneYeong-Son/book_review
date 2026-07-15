import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client.ts';
import type { Book, DiscussionSummary, Interest, Progress } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import BookCard from '../component/book_card.tsx';
import BookImportPanel from '../component/book_import_panel.tsx';
import StarRating from '../component/star_rating.tsx';

const HomePage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [myProgress, setMyProgress] = useState<Progress[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [recentReviews, setRecentReviews] = useState<Progress[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);

  const loadBooks = () => apiGet<Book[]>('/books').then(setBooks);
  const loadFeeds = () => {
    apiGet<Progress[]>('/progress').then(setRecentReviews).catch(() => setRecentReviews([]));
    apiGet<DiscussionSummary[]>('/discussions').then(setDiscussions).catch(() => setDiscussions([]));
  };

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
    loadFeeds();
  }, []);

  useEffect(() => {
    loadMine();
  }, [user]);

  const interestedIds = new Set(interests.map((i) => i.bookId));
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
    loadFeeds();
  };

  return (
    <section>
      <div className="hero">
        <h1>책을 기록하고, 당신의 세계를 다른 사람과 나눠보세요</h1>
        <p className="muted">
          {user ? `${user.name}님, 오늘은 어디까지 읽으셨나요?` : '로그인하면 독서 기록과 서평을 남길 수 있어요.'}
        </p>
      </div>

      {/* 서평 · 토론 두 칸으로 분리 */}
      <div className="dashboard">
        <div className="dash-col">
          <div className="dash-head">
            <h2>최근 서평</h2>
            <Link to="/records" className="muted small">전체 보기 →</Link>
          </div>
          {recentReviews.length === 0 ? (
            <p className="muted small">아직 서평이 없어요.</p>
          ) : (
            <ul className="feed">
              {recentReviews.slice(0, 6).map((r) => (
                <li key={r.id} className="feed-item">
                  <img src={r.book.cover} alt={r.book.title} className="feed-cover" />
                  <div className="feed-body">
                    <strong>{r.book.title}</strong>
                    <div className="record-meta">
                      <StarRating value={r.rating} size={14} />
                      <span className="muted small">{r.user.avatar} {r.user.name}</span>
                    </div>
                    {r.note && <p className="feed-note">{r.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dash-col">
          <div className="dash-head">
            <h2>토론</h2>
            <Link to="/discussions" className="muted small">전체 보기 →</Link>
          </div>
          {discussions.length === 0 ? (
            <p className="muted small">아직 토론이 없어요.</p>
          ) : (
            <ul className="feed">
              {discussions.slice(0, 6).map((d) => (
                <li key={d.id} className="feed-item">
                  <img src={d.book.cover} alt={d.book.title} className="feed-cover" />
                  <div className="feed-body">
                    <Link to={`/discussions/${d.id}`} className="discussion-title">{d.title}</Link>
                    <p className="muted small">{d.book.title} · {d.owner.name} · 댓글 {d._count.comments}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 책 둘러보기 · 기록하기 */}
      <div className="dash-head section-title">
        <h2>책 둘러보기</h2>
      </div>
      {user && <BookImportPanel onImported={loadBooks} />}
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
