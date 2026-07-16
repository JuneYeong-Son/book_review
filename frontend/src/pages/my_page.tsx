import { useEffect, useState, type MouseEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/shared/api/client.ts';
import type { Book, DiscussionSummary, Interest, Progress } from '@/shared/api/types.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import StarRating from '@/entities/star_rating.tsx';
import ReadingCalendar from '@/widgets/reading_calendar.tsx';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

type Tab = 'reviews' | 'books' | 'quotes' | 'discussions';
const TABS: { key: Tab; label: string }[] = [
  { key: 'reviews', label: '내 서평' },
  { key: 'books', label: '내 서재' },
  { key: 'quotes', label: '내 글귀' },
  { key: 'discussions', label: '내 토론' }
];

const MyPage = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'reviews';
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);

  const loadInterests = () =>
    apiGet<Interest[]>('/books/interests/me').then(setInterests).catch(() => setInterests([]));

  useEffect(() => {
    if (!user) return;
    apiGet<Progress[]>('/progress/me').then(setReviews).catch(() => setReviews([]));
    apiGet<DiscussionSummary[]>('/discussions/me').then(setDiscussions).catch(() => setDiscussions([]));
    loadInterests();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const interestedIds = new Set(interests.map((i) => i.bookId));
  const toggleInterest = async (e: MouseEvent, bookId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await apiPost(`/books/${bookId}/interest`);
    loadInterests();
  };

  // 책별로 묶기 (reviews는 최신순 → 첫 항목이 최신)
  const groups = new Map<string, { book: Book; count: number; latest: Progress }>();
  for (const record of reviews) {
    const existing = groups.get(record.bookId);
    if (existing) existing.count += 1;
    else groups.set(record.bookId, { book: record.book, count: 1, latest: record });
  }
  const bookGroups = [...groups.values()];

  return (
    <section>
      <div className="page-head">
        <h1>마이페이지</h1>
        <p className="muted">{user.avatar} {user.name}님의 기록</p>
      </div>

      {/* 마이페이지를 열면 달력이 바로 보임 */}
      <ReadingCalendar records={reviews} />

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setParams({ tab: t.key })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 내 서평 = 내가 기록한 책 (클릭 → 책별 서평 수정/삭제) */}
      {tab === 'reviews' && (
        bookGroups.length === 0 ? (
          <p className="muted">아직 남긴 서평이 없어요. <Link to="/">책을 기록해보세요.</Link></p>
        ) : (
          <div className="book-grid">
            {bookGroups.map((group) => (
              <Link key={group.book.id} to={`/mypage/book/${group.book.id}`} className="mybook-card">
                <img src={group.book.cover} alt={group.book.title} className="cover" width={140} height={200} loading="lazy" />
                <div className="book-body">
                  <h3>{group.book.title}</h3>
                  <p className="author">{group.book.author}</p>
                  <div className="my-progress">
                    <span className="page-badge">서평 {group.count}개</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* 내 책 = 관심 책 관리 (♥ 눌러 해제, ♡ 눌러 지정) */}
      {tab === 'books' && (
        <>
          {interests.length === 0 ? (
            <p className="muted">아직 관심 책이 없어요. 홈이나 책 페이지에서 ♡를 눌러 지정해보세요.</p>
          ) : (
            <div className="book-grid">
              {interests.map((it) => (
                <Link key={it.id} to={`/books/${it.bookId}`} className="mybook-card">
                  <div className="cover-wrap">
                    <img src={it.book.cover} alt={it.book.title} className="cover" width={140} height={200} loading="lazy" />
                    <button className="remove-btn" onClick={(e) => toggleInterest(e, it.bookId)} title="관심에서 제거">✕ 제거</button>
                  </div>
                  <div className="book-body">
                    <h3>{it.book.title}</h3>
                    <p className="author">{it.book.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'quotes' && (
        (() => {
          const quotes = reviews.filter((r) => r.quote.trim());
          return quotes.length === 0 ? (
            <p className="muted">아직 남긴 글귀가 없어요. 서평 쓸 때 인상깊은 글귀를 남겨보세요.</p>
          ) : (
            <ul className="quote-list">
              {quotes.map((r) => (
                <li key={r.id} className="quote-card-item">
                  <blockquote className="record-quote">“{r.quote}”</blockquote>
                  <p className="muted small">
                    <Link to={`/books/${r.bookId}/reviews/${r.bookSeq}`}>{r.book.title}</Link> · {formatDate(r.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          );
        })()
      )}

      {tab === 'discussions' && (
        discussions.length === 0 ? (
          <p className="muted">아직 참여한 토론이 없어요. <Link to="/discussions">토론에 참여해보세요.</Link></p>
        ) : (
          <ul className="discussion-list">
            {discussions.map((d) => (
              <li key={d.id} className="discussion-item">
                <img src={d.book.cover} alt={d.book.title} className="record-cover" width={54} height={76} loading="lazy" />
                <div className="discussion-main">
                  <Link to={`/discussions/${d.id}`} className="discussion-title">{d.title}</Link>
                  <p className="muted small">
                    {d.book.title} · {d.owner.id === user.id ? '내가 연 토론' : '댓글 참여'} · 댓글 {d._count.comments}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
};

export default MyPage;
