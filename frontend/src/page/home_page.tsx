import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client.ts';
import type { Book, DiscussionSummary, Interest, Progress, Recommendation, RecoMethod } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import BookCard from '../component/book_card.tsx';
import QuickActions from '../component/quick_actions.tsx';
import Carousel from '../component/carousel.tsx';
import StarRating from '../component/star_rating.tsx';

// 알라딘 베스트셀러 장르(분야) 필터 — label → 알라딘 CategoryId
const GENRES = [
  { label: '전체', id: '' },
  { label: '소설', id: '1' },
  { label: '경제경영', id: '170' },
  { label: '자기계발', id: '336' },
  { label: '인문학', id: '656' },
  { label: '에세이', id: '55889' }
];

const HomePage = () => {
  const { user } = useAuth();
  const [myProgress, setMyProgress] = useState<Progress[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [method, setMethod] = useState<RecoMethod>('content');
  const [genre, setGenre] = useState('');

  const loadFeeds = () => {
    apiGet<Progress[]>('/progress').then(setReviews).catch(() => setReviews([]));
    apiGet<DiscussionSummary[]>('/discussions').then(setDiscussions).catch(() => setDiscussions([]));
  };
  const loadReco = (m: RecoMethod, cat: string) => {
    const q = `/books/recommendations?method=${m}${m === 'popular' && cat ? `&categoryId=${cat}` : ''}`;
    apiGet<Recommendation[]>(q).then(setRecommendations).catch(() => setRecommendations([]));
  };
  const loadMine = () => {
    if (!user) { setMyProgress([]); setInterests([]); return; }
    apiGet<Progress[]>('/progress/me').then(setMyProgress).catch(() => setMyProgress([]));
    apiGet<Interest[]>('/books/interests/me').then(setInterests).catch(() => setInterests([]));
  };

  useEffect(() => { loadFeeds(); }, []);
  useEffect(() => { loadMine(); loadFeeds(); loadReco(method, genre); }, [user]);
  useEffect(() => { loadReco(method, genre); }, [method, genre]);

  const interestedIds = new Set(interests.map((i) => i.bookId));
  const latestByBook = new Map<string, Progress>();
  for (const record of myProgress) {
    if (!latestByBook.has(record.bookId)) latestByBook.set(record.bookId, record);
  }

  const myQuotes = myProgress.filter((p) => p.quote.trim()).slice(0, 2);

  const sortedReviews = [...reviews].sort((a, b) => {
    const d = (interestedIds.has(b.bookId) ? 1 : 0) - (interestedIds.has(a.bookId) ? 1 : 0);
    return d !== 0 ? d : b.likes.length - a.likes.length;
  });
  const sortedDiscussions = [...discussions].sort((a, b) => {
    const d = (interestedIds.has(b.book.id) ? 1 : 0) - (interestedIds.has(a.book.id) ? 1 : 0);
    return d !== 0 ? d : b._count.comments - a._count.comments;
  });

  const handleToggleInterest = async (bookId: string) => {
    await apiPost(`/books/${bookId}/interest`);
    loadMine(); loadFeeds();
  };
  const handleSaveProgress = async (
    bookId: string, startPage: number, endPage: number, note: string, quote: string, rating: number
  ) => {
    await apiPost('/progress', { bookId, startPage, endPage, note, quote, rating });
    loadMine(); loadFeeds(); loadReco(method, genre);
  };
  const handleImportReco = async (rec: Recommendation) => {
    await apiPost('/books/import', {
      title: rec.book.title, author: rec.book.author, cover: rec.book.cover,
      genre: rec.book.genre, category: rec.book.category, isbn: rec.book.isbn ?? ''
    });
    loadFeeds(); loadReco(method, genre);
  };

  return (
    <section>
      <div className="hero">
        <h1>책을 기록하고, 당신의 세계를 다른 사람과 나눠보세요</h1>
        <p className="muted">
          {user ? `${user.name}님, 오늘은 어디까지 읽으셨나요?` : '로그인하면 독서 기록과 서평을 남길 수 있어요.'}
        </p>
        {user && <QuickActions onChange={() => { loadMine(); loadFeeds(); loadReco(method, genre); }} />}
      </div>

      {myQuotes.length > 0 && (
        <div className="quote-strip">
          {myQuotes.map((q) => (
            <blockquote key={q.id} className="my-quote">“{q.quote}”<cite>— {q.book.title}</cite></blockquote>
          ))}
        </div>
      )}

      {/* 서평 캐러셀 (박스 클릭 → 서평 상세) */}
      <div className="dash-head section-title"><h2>서평</h2><Link to="/records" className="muted small">전체 보기 →</Link></div>
      {sortedReviews.length === 0 ? (
        <p className="muted">아직 서평이 없어요.</p>
      ) : (
        <Carousel>
          {sortedReviews.map((r) => (
            <Link key={r.id} to={`/reviews/${r.id}`} className="sq-card">
              <img src={r.book.cover} alt={r.book.title} className="sq-cover" />
              <div className="sq-body">
                <strong className="sq-title">{r.book.title}</strong>
                <div className="record-meta">
                  <StarRating value={r.rating} size={14} />
                  <span className="like-count">♥ {r.likes.length}</span>
                </div>
                <p className="muted small">{r.user.avatar} {r.user.name} · {r.startPage}~{r.endPage}쪽</p>
                {r.note && <p className="sq-note">{r.note}</p>}
              </div>
            </Link>
          ))}
        </Carousel>
      )}

      {/* 토론 캐러셀 */}
      <div className="dash-head section-title"><h2>토론</h2><Link to="/discussions" className="muted small">전체 보기 →</Link></div>
      {sortedDiscussions.length === 0 ? (
        <p className="muted">아직 토론이 없어요.</p>
      ) : (
        <Carousel>
          {sortedDiscussions.map((d) => (
            <Link key={d.id} to={`/discussions/${d.id}`} className="sq-card">
              <img src={d.book.cover} alt={d.book.title} className="sq-cover" />
              <div className="sq-body">
                <strong className="sq-title">{d.title}</strong>
                <p className="muted small">{d.book.title}</p>
                <p className="muted small">{d.owner.avatar} {d.owner.name} · 댓글 {d._count.comments}</p>
              </div>
            </Link>
          ))}
        </Carousel>
      )}

      {/* 추천하는 책 (캐러셀) */}
      <div className="dash-head section-title"><h2>추천하는 책</h2></div>
      <div className="reco-methods">
        <button className={`chip ${method === 'content' ? 'active' : ''}`} onClick={() => setMethod('content')}>읽은 책과 비슷한 책</button>
        <button className={`chip ${method === 'popular' ? 'active' : ''}`} onClick={() => setMethod('popular')}>요즘 많이 사는 책</button>
      </div>
      {method === 'popular' && (
        <div className="reco-methods genre-filter">
          {GENRES.map((g) => (
            <button key={g.id} className={`chip small ${genre === g.id ? 'active' : ''}`} onClick={() => setGenre(g.id)}>{g.label}</button>
          ))}
        </div>
      )}

      {recommendations.length === 0 ? (
        <p className="muted">
          {method === 'popular'
            ? '베스트셀러를 불러오지 못했어요. (알라딘 키를 확인해주세요)'
            : '추천할 책이 아직 없어요. 책을 기록하면 취향에 맞는 책을 추천해드려요.'}
        </p>
      ) : (
        <Carousel>
          {recommendations.map((rec, idx) =>
            rec.inLibrary && rec.book.id ? (
              <div key={rec.book.id} className="reco-slot">
                <BookCard
                  book={{
                    id: rec.book.id, title: rec.book.title, author: rec.book.author,
                    cover: rec.book.cover, genre: rec.book.genre, category: rec.book.category
                  }}
                  latest={latestByBook.get(rec.book.id)}
                  interested={interestedIds.has(rec.book.id)}
                  loggedIn={Boolean(user)}
                  reason={rec.reason}
                  onToggleInterest={handleToggleInterest}
                  onSaveProgress={handleSaveProgress}
                />
              </div>
            ) : (
              <article key={`${rec.book.isbn}-${idx}`} className="book-card reco-slot">
                <div className="cover-wrap"><img src={rec.book.cover} alt={rec.book.title} className="cover" /></div>
                <div className="book-body">
                  <p className="reason">{rec.reason}</p>
                  <h3>{rec.book.title}</h3>
                  <p className="author">{rec.book.author}</p>
                  <div className="tags">{rec.book.genre && <span className="tag">{rec.book.genre}</span>}</div>
                  {user && <button className="btn ghost small" onClick={() => handleImportReco(rec)}>내 서재에 추가</button>}
                </div>
              </article>
            )
          )}
        </Carousel>
      )}
    </section>
  );
};

export default HomePage;
