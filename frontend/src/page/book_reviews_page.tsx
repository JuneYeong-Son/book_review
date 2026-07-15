import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../api/client.ts';
import type { Book, DiscussionSummary, Progress } from '../api/types.ts';
import StarRating from '../component/star_rating.tsx';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

const BookReviewsPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);

  useEffect(() => {
    if (!bookId) return;
    apiGet<Book>(`/books/${bookId}`).then(setBook).catch(() => setBook(null));
    apiGet<Progress[]>(`/progress/book/${bookId}`).then(setReviews).catch(() => setReviews([]));
    // 이 책과 관련된 토론
    apiGet<DiscussionSummary[]>('/discussions')
      .then((all) => setDiscussions(all.filter((d) => d.book.id === bookId)))
      .catch(() => setDiscussions([]));
  }, [bookId]);

  return (
    <section>
      <Link to="/" className="muted small">← 홈</Link>
      {book && (
        <div className="detail-head">
          <img src={book.cover} alt={book.title} className="record-cover" />
          <div>
            <h1>{book.title}</h1>
            <p className="muted">{book.author}</p>
            <div className="tags">
              {book.genre && <span className="tag">{book.genre}</span>}
              {book.category && <span className="tag">{book.category}</span>}
            </div>
          </div>
        </div>
      )}

      <h2 className="section-title">이 책의 서평 ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p className="muted">아직 이 책의 서평이 없어요.</p>
      ) : (
        <ul className="record-list">
          {reviews.map((r) => (
            <li key={r.id} className="record-item">
              <div className="record-main">
                <Link to={`/reviews/${r.id}`} className="record-top">
                  <strong>{r.user.avatar} {r.user.name}</strong>
                </Link>
                <div className="record-meta">
                  <StarRating value={r.rating} size={16} />
                  <span className="page-badge">{r.startPage}~{r.endPage}쪽</span>
                  <span className="like-count">♥ {r.likes.length}</span>
                  <span className="muted small">{formatDate(r.createdAt)}</span>
                </div>
                {r.note && <p className="record-note">{r.note}</p>}
                <Link to={`/reviews/${r.id}`} className="muted small">서평 자세히 보기 →</Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">이 책의 토론 ({discussions.length})</h2>
      {discussions.length === 0 ? (
        <p className="muted">아직 이 책의 토론이 없어요.</p>
      ) : (
        <ul className="discussion-list">
          {discussions.map((d) => (
            <li key={d.id} className="discussion-item">
              <div className="discussion-main">
                <Link to={`/discussions/${d.id}`} className="discussion-title">{d.title}</Link>
                <p className="muted small">{d.owner.avatar} {d.owner.name} · 댓글 {d._count.comments}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default BookReviewsPage;
