import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { apiGet } from '../api/client.ts';
import type { Book, DiscussionSummary, Progress } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import StarRating from '../component/star_rating.tsx';

type BookGroup = {
  book: Book;
  count: number;
  latest: Progress;
};

const MyPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    apiGet<Progress[]>('/progress/me').then(setReviews).catch(() => setReviews([]));
    apiGet<DiscussionSummary[]>('/discussions/me').then(setDiscussions).catch(() => setDiscussions([]));
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  // 책별로 묶기 (reviews는 최신순 → 첫 항목이 최신)
  const groups = new Map<string, BookGroup>();
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
        <p className="muted">{user.avatar} {user.name}님이 기록한 책과 참여한 토론이에요.</p>
      </div>

      <h2 className="section-title">내가 기록한 책 ({bookGroups.length})</h2>
      {bookGroups.length === 0 ? (
        <p className="muted">아직 남긴 서평이 없어요. <Link to="/">책을 기록해보세요.</Link></p>
      ) : (
        <div className="book-grid">
          {bookGroups.map((group) => (
            <Link key={group.book.id} to={`/mypage/book/${group.book.id}`} className="mybook-card">
              <img src={group.book.cover} alt={group.book.title} className="cover" />
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
      )}

      <h2 className="section-title">참여한 토론 ({discussions.length})</h2>
      {discussions.length === 0 ? (
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
      )}
    </section>
  );
};

export default MyPage;
