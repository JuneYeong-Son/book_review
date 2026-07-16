import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mutate } from 'swr';
import { apiGet, apiPost } from '@/shared/api/client.ts';
import type { Book, DiscussionSummary, Progress, Recommendation, RecoMethod } from '@/shared/api/types.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import { useMyProgress, useMyInterests, KEY } from '@/shared/api/hooks.ts';
import BookCard from '@/entities/book_card.tsx';
import QuickActions from '@/widgets/quick_actions.tsx';
import Carousel from '@/widgets/carousel.tsx';

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

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // 공용 SWR 훅: /progress/me·/books/interests/me는 QuickActions·마이페이지와 캐시를 공유(중복 fetch 제거)
  const { data: myProgress = [] } = useMyProgress();
  const { data: interests = [] } = useMyInterests();
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [reviewsEnd, setReviewsEnd] = useState(false);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [discEnd, setDiscEnd] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recoEnd, setRecoEnd] = useState(false);
  const [method, setMethod] = useState<RecoMethod>('content');
  const [genre, setGenre] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dismissedExternal, setDismissedExternal] = useState<Set<string>>(new Set());

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

  // --- 추천 (content=읽은 책과 비슷(CF); popular=알라딘 베스트셀러 페이지네이션) ---
  const loadReco = async (reset: boolean) => {
    if (method !== 'popular') {
      setRecommendations(await apiGet<Recommendation[]>('/books/recommendations?method=content').catch(() => []));
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

  useEffect(() => { loadReviews(true); loadDiscussions(true); }, []);
  useEffect(() => { loadReco(true); }, [method, genre, user]);

  const interestedIds = useMemo(() => new Set(interests.map((i) => i.bookId)), [interests]);
  const latestByBook = useMemo(() => {
    const map = new Map<string, Progress>();
    for (const record of myProgress) {
      if (!map.has(record.bookId)) map.set(record.bookId, record);
    }
    return map;
  }, [myProgress]);

  const myQuotes = useMemo(() => myProgress.filter((p) => p.quote.trim()).slice(0, 2), [myProgress]);

  const sortedReviews = useMemo(() => [...reviews].sort((a, b) => {
    const d = (interestedIds.has(b.bookId) ? 1 : 0) - (interestedIds.has(a.bookId) ? 1 : 0);
    return d !== 0 ? d : b.likes.length - a.likes.length;
  }), [reviews, interestedIds]);
  const sortedDiscussions = useMemo(() => [...discussions].sort((a, b) => {
    const d = (interestedIds.has(b.book.id) ? 1 : 0) - (interestedIds.has(a.book.id) ? 1 : 0);
    return d !== 0 ? d : b._count.comments - a._count.comments;
  }), [discussions, interestedIds]);

  const handleToggleInterest = async (bookId: string) => {
    await apiPost(`/books/${bookId}/interest`);
    mutate(KEY.interestsMe); loadReviews(true);
  };
  const handleSaveProgress = async (
    bookId: string, startPage: number, endPage: number, note: string, quote: string, rating: number
  ) => {
    await apiPost('/progress', { bookId, startPage, endPage, note, quote, rating });
    mutate(KEY.progressMe); mutate(KEY.interestsMe); loadReviews(true); loadReco(true);
  };
  const handleImportReco = async (rec: Recommendation) => {
    // 임포트 후 내 서재(관심)에 담기 → 마이페이지 '내 서재'에 표시됨
    const book = await apiPost<Book>('/books/import', {
      title: rec.book.title, author: rec.book.author, cover: rec.book.cover,
      genre: rec.book.genre, category: rec.book.category, isbn: rec.book.isbn ?? ''
    });
    if (!interestedIds.has(book.id)) await apiPost(`/books/${book.id}/interest`);
    mutate(KEY.interestsMe); loadReco(true);
  };
  // 추천 X: 라이브러리 책은 '추천 안 받을 책'에 영구 저장, 외부(베스트셀러)는 이번 세션에서 숨김
  const handleDismissReco = async (rec: Recommendation) => {
    if (rec.book.id) {
      await apiPost(`/books/${rec.book.id}/reco-exclude`);
      loadReco(true); // 제외 후 다른 추천으로 채워짐
    } else {
      setDismissedExternal((prev) => new Set(prev).add(rec.book.isbn || rec.book.title));
      if (!recoEnd) loadReco(false);
    }
  };
  // 외부(베스트셀러) 책: 클릭 시 우리 DB에 담고 그 책의 서평 페이지로 이동
  const openExternal = async (rec: Recommendation) => {
    if (rec.book.id) { navigate(`/books/${rec.book.id}`); return; }
    const book = await apiPost<Book>('/books/import', {
      title: rec.book.title, author: rec.book.author, cover: rec.book.cover,
      genre: rec.book.genre, category: rec.book.category, isbn: rec.book.isbn ?? ''
    });
    navigate(`/books/${book.id}`);
  };

  return (
    <section>
      <div className="hero">
        <h1>책을 기록하고, 당신의 세계를 다른 사람과 나눠보세요</h1>
        <p className="muted">
          {user ? `${user.name}님, 오늘은 어디까지 읽으셨나요?` : '로그인하면 독서 기록과 서평을 남길 수 있어요.'}
        </p>
        {user && <QuickActions onChange={() => { loadReviews(true); loadDiscussions(true); loadReco(true); }} />}
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
            <Link key={r.id} to={`/books/${r.bookId}/reviews/${r.bookSeq}`} className="sq-card review-card">
              <img src={r.book.cover} alt={r.book.title} className="sq-cover" width={220} height={112} loading="lazy" />
              <div className="sq-body">
                <span className="sq-book">{r.book.title}</span>
                {r.note
                  ? <p className="sq-review">{r.note}</p>
                  : <p className="sq-review muted">{r.startPage}~{r.endPage}쪽까지 읽었어요.</p>}
                <div className="sq-foot">
                  <span className="sq-reader">{r.user.avatar} {r.user.name}</span>
                  <span className="like-count">♥ {r.likes.length}</span>
                </div>
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
              <img src={d.book.cover} alt={d.book.title} className="sq-cover" width={220} height={170} loading="lazy" />
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
        {method === 'popular'
          ? `요즘 많이 사는 책 · ${GENRES.find((g) => g.id === genre)?.label ?? '전체'}`
          : '읽은 책과 비슷한 책'}
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
            ? '베스트셀러를 불러오지 못했어요. (알라딘 키를 확인해주세요)'
            : '추천할 책이 아직 없어요. 책을 기록하면 취향에 맞는 책을 추천해드려요.'}
        </p>
      ) : (
        <Carousel onLoadMore={recoEnd ? undefined : () => loadReco(false)}>
          {recommendations
            .filter((r) => r.book.id || !dismissedExternal.has(r.book.isbn || r.book.title))
            .map((rec, idx) =>
            rec.inLibrary && rec.book.id ? (
              <div key={`${rec.book.id}-${idx}`} className="reco-slot">
                <BookCard
                  book={{
                    id: rec.book.id, title: rec.book.title, author: rec.book.author,
                    cover: rec.book.cover, genre: rec.book.genre, category: rec.book.category
                  }}
                  latest={latestByBook.get(rec.book.id)}
                  interested={interestedIds.has(rec.book.id)}
                  reason={rec.reason}
                  onDismiss={user ? () => handleDismissReco(rec) : undefined}
                  onToggleInterest={handleToggleInterest}
                  onSaveProgress={handleSaveProgress}
                />
              </div>
            ) : (
              <article key={`${rec.book.isbn}-${idx}`} className="book-card reco-slot">
                <div className="cover-wrap">
                  <button className="cover-link" onClick={() => openExternal(rec)} aria-label={`${rec.book.title} 담고 서평 보러가기`}>
                    <img src={rec.book.cover} alt={rec.book.title} className="cover" width={140} height={200} loading="lazy" />
                  </button>
                  {user && <button className="dismiss-btn" onClick={() => handleDismissReco(rec)} aria-label="추천 안 받기">✕</button>}
                </div>
                <div className="book-body">
                  <p className="reason">{rec.reason}</p>
                  <button className="book-title-btn" onClick={() => openExternal(rec)}><h3>{rec.book.title}</h3></button>
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
