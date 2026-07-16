import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost } from '@/shared/api/client.ts';
import type { Book, DiscussionSummary, Progress } from '@/shared/api/types.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import StarRating from '@/entities/star_rating.tsx';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

type RatingInfo = { average: number; count: number; mine: number };

const BookReviewsPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [rating, setRating] = useState<RatingInfo>({ average: 0, count: 0, mine: 0 });

  const loadRating = () => {
    if (bookId) apiGet<RatingInfo>(`/books/${bookId}/rating`).then(setRating).catch(() => {});
  };

  useEffect(() => {
    if (!bookId) return;
    apiGet<Book>(`/books/${bookId}`).then(setBook).catch(() => setBook(null));
    apiGet<Progress[]>(`/progress/book/${bookId}`)
      .then((list) => setReviews([...list].sort((a, b) => b.likes.length - a.likes.length)))
      .catch(() => setReviews([]));
    apiGet<DiscussionSummary[]>('/discussions')
      .then((all) => setDiscussions(all.filter((d) => d.book.id === bookId)))
      .catch(() => setDiscussions([]));
    loadRating();
  }, [bookId]);

  const rate = async (value: number) => {
    if (!user || !bookId) return;
    await apiPost(`/books/${bookId}/rating`, { value });
    loadRating();
  };

  return (
    <section>
      <Link to="/" className="muted small">← 홈</Link>

      {book && (
        <div className="book-detail-head">
          <img src={book.cover} alt={book.title} className="book-detail-cover" width={220} height={300} fetchPriority="high" />
          <div className="book-detail-info">
            <h1>{book.title}</h1>
            <p className="author">{book.author}</p>
            <div className="tags">
              {book.genre && <span className="tag">{book.genre}</span>}
              {book.category && <span className="tag">{book.category}</span>}
            </div>
            {book.publisher && <p className="muted small">출판사 · {book.publisher}</p>}

            <div className="book-rating">
              <div className="rating-avg">
                <StarRating value={Math.round(rating.average)} size={20} />
                <span className="rating-num">{rating.average.toFixed(1)}</span>
                <span className="muted small">({rating.count}명)</span>
              </div>
              {user && (
                <div className="rating-mine">
                  <span className="muted small">내 별점</span>
                  <StarRating value={rating.mine} onChange={rate} size={24} />
                </div>
              )}
            </div>

            {book.description && <p className="book-desc">{book.description}</p>}
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
                <Link to={`/books/${r.bookId}/reviews/${r.bookSeq}`} className="record-top">
                  <strong>{r.user.avatar} {r.user.name}</strong>
                </Link>
                <div className="record-meta">
                  <span className="page-badge">{r.startPage}~{r.endPage}쪽</span>
                  <span className="like-count">♥ {r.likes.length}</span>
                  <span className="muted small">{formatDate(r.createdAt)}</span>
                </div>
                {r.note && <p className="record-note">{r.note}</p>}
                <Link to={`/books/${r.bookId}/reviews/${r.bookSeq}`} className="muted small">서평 자세히 보기 →</Link>
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
