import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client.ts';
import type { Book, DiscussionSummary, Interest, Progress, Recommendation, RecoMethod } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import BookCard from '../component/book_card.tsx';
import QuickActions from '../component/quick_actions.tsx';
import Carousel from '../component/carousel.tsx';
import StarRating from '../component/star_rating.tsx';

const PAGE = 8;

// 알라딘 베스트셀러 장르(분야) 필터 — label → 알라딘 CategoryId
const GENRES = [
  { label: '전체', id: '' },
  { label: '소설', id: '1' },
  { label: '경제경영', id: '170' },
  { label: '자기계발', id: '336' },
  { label: '인문학', id: '656' },
  { label: '에세이', id: '55889' }
];

// 연령대 필터 (우리 플랫폼 자체 집계) — 0 = 전체(알라딘 베스트셀러)
const AGE_GROUPS = [
  { label: '전체', value: 0 },
  { label: '10대', value: 10 },
  { label: '20대', value: 20 },
  { label: '30대', value: 30 },
  { label: '40대', value: 40 },
  { label: '50대+', value: 50 }
];

const HomePage = () => {
  const { user } = useAuth();
  const [myProgress, setMyProgress] = useState<Progress[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [reviewsEnd, setReviewsEnd] = useState(false);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [discEnd, setDiscEnd] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recoEnd, setRecoEnd] = useState(false);
  const [method, setMethod] = useState<RecoMethod>('content');
  const [genre, setGenre] = useState('');
  const [ageGroup, setAgeGroup] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  // --- 서평 피드 (무한 로드) ---
  const loadReviews = async (reset: boolean) => {
    const skip = reset ? 0 : reviews.length;
    const page = await apiGet<Progress[]>(`/progress?skip=${skip}&take=${PAGE}`).catch(() => []);
    setReviews((prev) => (reset ? page : [...prev, ...page]));
    setReviewsEnd(page.length < PAGE);
  };

  // --- 토론 피드 (무한 로드) ---
  const loadDiscussions = async (reset: boolean) => {
    const skip = reset ? 0 : discussions.length;
    const page = await apiGet<DiscussionSummary[]>(`/discussions?skip=${skip}&take=${PAGE}`).catch(() => []);
    setDiscussions((prev) => (reset ? page : [...prev, ...page]));
    setDiscEnd(page.length < PAGE);
  };

  // --- 추천 (popular=알라딘은 페이지네이션, content/연령대는 단일) ---
  const loadReco = async (reset: boolean) => {
    if (method === 'content') {
      setRecommendations(await apiGet<Recommendation[]>('/books/recommendations?method=content').catch(() => []));
      setRecoEnd(true);
      return;
    }
    if (ageGroup) {
      setRecommendations(await apiGet<Recommendation[]>(`/books/recommendations?method=popular&ageGroup=${ageGroup}`).catch(() => []));
      setRecoEnd(true);
      return;
    }
    // 알라딘 베스트셀러: start(페이지) 증가로 이어 불러오기
    const current = reset ? [] : recommendations;
    const startPage = reset ? 1 : Math.floor(current.length / 10) + 1;
    const q = `/books/recommendations?method=popular&start=${startPage}${genre ? `&categoryId=${genre}` : ''}`;
    const page = await apiGet<Recommendation[]>(q).catch(() => []);
    setRecommendations(reset ? page : [...current, ...page]);
    setRecoEnd(page.length < 10);
  };

  const loadMine = () => {
    if (!user) { setMyProgress([]); setInterests([]); return; }
    apiGet<Progress[]>('/progress/me').then(setMyProgress).catch(() => setMyProgress([]));
    apiGet<Interest[]>('/books/interests/me').then(setInterests).catch(() => setInterests([]));
  };

  useEffect(() => { loadReviews(true); loadDiscussions(true); }, []);
  useEffect(() => { loadMine(); }, [user]);
  useEffect(() => { loadReco(true); }, [method, genre, ageGroup, user]);

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
    loadMine(); loadReviews(true);
  };
  const handleSaveProgress = async (
    bookId: string, startPage: number, endPage: number, note: string, quote: string, rating: number
  ) => {
    await apiPost('/progress', { bookId, startPage, endPage, note, quote, rating });
    loadMine(); loadReviews(true); loadReco(true);
  };
  const handleImportReco = async (rec: Recommendation) => {
    await apiPost('/books/import', {
      title: rec.book.title, author: rec.book.author, cover: rec.book.cover,
      genre: rec.book.genre, category: rec.book.category, isbn: rec.book.isbn ?? ''
    });
    loadReco(true);
  };

  return (
    <section>
      <div className="hero">
        <h1>책을 기록하고, 당신의 세계를 다른 사람과 나눠보세요</h1>
        <p className="muted">
          {user ? `${user.name}님, 오늘은 어디까지 읽으셨나요?` : '로그인하면 독서 기록과 서평을 남길 수 있어요.'}
        </p>
        {user && <QuickActions onChange={() => { loadMine(); loadReviews(true); loadDiscussions(true); loadReco(true); }} />}
      </div>

      {myQuotes.length > 0 && (
        <div className="quote-strip">
          {myQuotes.map((q) => (
            <blockquote key={q.id} className="my-quote">“{q.quote}”<cite>— {q.book.title}</cite></blockquote>
          ))}
        </div>
      )}

      {/* 서평 캐러셀 (박스 클릭 → 서평 상세, › 끝에서 더 불러오기) */}
      <div className="dash-head section-title"><h2>서평</h2><Link to="/records" className="muted small">전체 보기 →</Link></div>
      {sortedReviews.length === 0 ? (
        <p className="muted">아직 서평이 없어요.</p>
      ) : (
        <Carousel onLoadMore={reviewsEnd ? undefined : () => loadReviews(false)}>
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
        <Carousel onLoadMore={discEnd ? undefined : () => loadDiscussions(false)}>
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

      {/* 추천하는 책 — 필터 버튼 하나로 정리 */}
      <div className="dash-head section-title">
        <h2>추천하는 책</h2>
        <button className="btn ghost small" onClick={() => setFilterOpen((v) => !v)}>필터 ▾</button>
      </div>
      <p className="muted small reco-summary">
        {method === 'content'
          ? '읽은 책과 비슷한 책'
          : ageGroup
            ? `요즘 많이 사는 책 · ${AGE_GROUPS.find((a) => a.value === ageGroup)?.label}`
            : `요즘 많이 사는 책 · ${GENRES.find((g) => g.id === genre)?.label ?? '전체'}`}
      </p>
      {filterOpen && (
        <div className="reco-filter-panel">
          <label>추천 방식
            <select value={method} onChange={(e) => setMethod(e.target.value as RecoMethod)}>
              <option value="content">읽은 책과 비슷한 책</option>
              <option value="popular">요즘 많이 사는 책</option>
            </select>
          </label>
          {method === 'popular' && (
            <label>연령대
              <select value={ageGroup} onChange={(e) => setAgeGroup(Number(e.target.value))}>
                {AGE_GROUPS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </label>
          )}
          {method === 'popular' && ageGroup === 0 && (
            <label>주제
              <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                {GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </label>
          )}
        </div>
      )}

      {recommendations.length === 0 ? (
        <p className="muted">
          {method === 'popular'
            ? (ageGroup ? '아직 이 연령대의 데이터가 부족해요.' : '베스트셀러를 불러오지 못했어요. (알라딘 키를 확인해주세요)')
            : '추천할 책이 아직 없어요. 책을 기록하면 취향에 맞는 책을 추천해드려요.'}
        </p>
      ) : (
        <Carousel onLoadMore={recoEnd ? undefined : () => loadReco(false)}>
          {recommendations.map((rec, idx) =>
            rec.inLibrary && rec.book.id ? (
              <div key={`${rec.book.id}-${idx}`} className="reco-slot">
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
