import { useEffect, useState, type MouseEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client.ts';
import type { Book, DiscussionSummary, Interest, Progress } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import StarRating from '../component/star_rating.tsx';
import ReadingCalendar from '../component/reading_calendar.tsx';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

type Tab = 'reviews' | 'books' | 'discussions';
const TABS: { key: Tab; label: string }[] = [
  { key: 'reviews', label: '내 서평' },
  { key: 'books', label: '내 책' },
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

      {tab === 'reviews' && (
        reviews.length === 0 ? (
          <p className="muted">아직 남긴 서평이 없어요. <Link to="/">책을 기록해보세요.</Link></p>
        ) : (
          <ul className="record-list">
            {reviews.map((record) => (
              <li key={record.id} className="record-item">
                <img src={record.book.cover} alt={record.book.title} className="record-cover" />
                <div className="record-main">
                  <div className="record-top">
                    <Link to={`/mypage/book/${record.bookId}`}><strong>{record.book.title}</strong></Link>
                  </div>
                  <div className="record-meta">
                    <StarRating value={record.rating} size={16} />
                    <span className="page-badge">{record.startPage}~{record.endPage}쪽</span>
                    <span className="muted small">{formatDate(record.createdAt)}</span>
                  </div>
                  {record.note && <p className="record-note">{record.note}</p>}
                  {record.quote && <blockquote className="record-quote">“{record.quote}”</blockquote>}
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'books' && (
        bookGroups.length === 0 ? (
          <p className="muted">아직 기록한 책이 없어요. <Link to="/">책을 기록해보세요.</Link></p>
        ) : (
          <div className="book-grid">
            {bookGroups.map((group) => (
              <Link key={group.book.id} to={`/mypage/book/${group.book.id}`} className="mybook-card">
                <div className="cover-wrap">
                  <img src={group.book.cover} alt={group.book.title} className="cover" />
                  <button
                    className={`interest ${interestedIds.has(group.book.id) ? 'on' : ''}`}
                    onClick={(e) => toggleInterest(e, group.book.id)}
                    title="관심 책"
                  >
                    {interestedIds.has(group.book.id) ? '♥' : '♡'}
                  </button>
                </div>
                <div className="book-body">
                  <h3>{group.book.title}</h3>
                  <p className="author">{group.book.author}</p>
                  <div className="my-progress">
                    <StarRating value={group.latest.rating} size={16} />
                    <span className="page-badge">서평 {group.count}개</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'discussions' && (
        discussions.length === 0 ? (
          <p className="muted">아직 참여한 토론이 없어요. <Link to="/discussions">토론에 참여해보세요.</Link></p>
        ) : (
          <ul className="discussion-list">
            {discussions.map((d) => (
              <li key={d.id} className="discussion-item">
                <img src={d.book.cover} alt={d.book.title} className="record-cover" />
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
