import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client.ts';
import type { Book, DiscussionSummary, Interest, Progress, Recommendation } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import BookCard from '../component/book_card.tsx';
import BookImportPanel from '../component/book_import_panel.tsx';
import QuickActions from '../component/quick_actions.tsx';
import StarRating from '../component/star_rating.tsx';

const HomePage = () => {
  const { user } = useAuth();
  const [myProgress, setMyProgress] = useState<Progress[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const loadFeeds = () => {
    apiGet<Progress[]>('/progress').then(setReviews).catch(() => setReviews([]));
    apiGet<DiscussionSummary[]>('/discussions').then(setDiscussions).catch(() => setDiscussions([]));
    apiGet<Recommendation[]>('/books/recommendations').then(setRecommendations).catch(() => setRecommendations([]));
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

  useEffect(() => { loadFeeds(); }, []);
  useEffect(() => { loadMine(); loadFeeds(); }, [user]);

  const interestedIds = new Set(interests.map((i) => i.bookId));
  const latestByBook = new Map<string, Progress>();
  for (const record of myProgress) {
    if (!latestByBook.has(record.bookId)) latestByBook.set(record.bookId, record);
  }

  // 서평: 관심 책 우선 + 좋아요 많은 순
  const sortedReviews = [...reviews].sort((a, b) => {
    const ia = interestedIds.has(a.bookId) ? 1 : 0;
    const ib = interestedIds.has(b.bookId) ? 1 : 0;
    if (ia !== ib) return ib - ia;
    return b.likes.length - a.likes.length;
  });

  // 토론: 관심 책 우선 + 댓글(인기) 많은 순
  const sortedDiscussions = [...discussions].sort((a, b) => {
    const ia = interestedIds.has(a.book.id) ? 1 : 0;
    const ib = interestedIds.has(b.book.id) ? 1 : 0;
    if (ia !== ib) return ib - ia;
    return b._count.comments - a._count.comments;
  });

  const handleToggleInterest = async (bookId: string) => {
    await apiPost(`/books/${bookId}/interest`);
    loadMine();
    loadFeeds();
  };

  const handleSaveProgress = async (
    bookId: string, startPage: number, endPage: number, note: string, quote: string, rating: number
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
        {user && <QuickActions onChange={() => { loadMine(); loadFeeds(); }} />}
      </div>

      {/* 서평 — 가로 전체 폭 */}
      <div className="dash-head section-title"><h2>서평</h2><Link to="/records" className="muted small">전체 보기 →</Link></div>
      {sortedReviews.length === 0 ? (
        <p className="muted small">아직 서평이 없어요.</p>
      ) : (
        <ul className="record-list">
          {sortedReviews.slice(0, 6).map((r) => (
            <li key={r.id} className="record-item">
              <img src={r.book.cover} alt={r.book.title} className="record-cover" />
              <div className="record-main">
                <div className="record-top">
                  <strong>{r.book.title}</strong>
                  {interestedIds.has(r.bookId) && <span className="tag">관심 책</span>}
                  <span className="muted small"> · {r.user.avatar} {r.user.name}</span>
                </div>
                <div className="record-meta">
                  <StarRating value={r.rating} size={16} />
                  <span className="page-badge">{r.startPage}~{r.endPage}쪽</span>
                  <span className="like-count">♥ {r.likes.length}</span>
                </div>
                {r.note && <p className="record-note">{r.note}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 토론 — 가로 전체 폭 */}
      <div className="dash-head section-title"><h2>토론</h2><Link to="/discussions" className="muted small">전체 보기 →</Link></div>
      {sortedDiscussions.length === 0 ? (
        <p className="muted small">아직 토론이 없어요.</p>
      ) : (
        <ul className="discussion-list">
          {sortedDiscussions.slice(0, 6).map((d) => (
            <li key={d.id} className="discussion-item">
              <img src={d.book.cover} alt={d.book.title} className="record-cover" />
              <div className="discussion-main">
                <Link to={`/discussions/${d.id}`} className="discussion-title">{d.title}</Link>
                {interestedIds.has(d.book.id) && <span className="tag">관심 책</span>}
                <p className="muted small">{d.book.title} · {d.owner.name} · 댓글 {d._count.comments}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 추천 — 이런 책을 추천해요! */}
      <div className="dash-head section-title"><h2>🤖 이런 책을 추천해요!</h2></div>
      {user && <BookImportPanel onImported={loadFeeds} />}
      {recommendations.length === 0 ? (
        <p className="muted small">추천할 책이 아직 없어요. 책을 기록하면 취향에 맞는 책을 추천해드려요.</p>
      ) : (
        <div className="book-grid">
          {recommendations.map((rec) => (
            <BookCard
              key={rec.book.id}
              book={rec.book}
              latest={latestByBook.get(rec.book.id)}
              interested={interestedIds.has(rec.book.id)}
              loggedIn={Boolean(user)}
              reason={rec.reason}
              onToggleInterest={handleToggleInterest}
              onSaveProgress={handleSaveProgress}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HomePage;
