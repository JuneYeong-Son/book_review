import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client.ts';
import type { ReviewDetail } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import StarRating from '../component/star_rating.tsx';
import ReportButton from '../component/report_button.tsx';

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('ko-KR');

const ReviewDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    if (id) apiGet<ReviewDetail>(`/progress/${id}`).then(setReview).catch(() => setReview(null));
  };

  useEffect(() => { load(); }, [id]);

  const handleLike = async () => {
    if (!user || !id) return;
    await apiPost(`/progress/${id}/like`);
    load();
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiPost(`/progress/${id}/comments`, { text });
      setText('');
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!review) return <p className="muted">서평을 불러오는 중...</p>;

  const likedByMe = review.likes.some((l) => l.userId === user?.id);

  return (
    <section className="review-detail">
      <Link to="/records" className="muted small">← 독서 기록</Link>
      <div className="detail-head">
        <Link to={`/books/${review.book.id}`}>
          <img src={review.book.cover} alt={review.book.title} className="record-cover" />
        </Link>
        <div>
          <Link to={`/books/${review.book.id}`}><h1>{review.book.title}</h1></Link>
          <p className="muted">{review.book.author}</p>
          <p className="muted small">
            {review.user.avatar} <Link to={`/users/${review.user.id}`} className="user-link">{review.user.name}</Link> · {formatDateTime(review.createdAt)}
            {review.user.id !== user?.id && (
              <> · <ReportButton targetType="user" targetId={review.user.id} label="사용자 신고" /></>
            )}
          </p>
          <div className="record-meta">
            <span className="page-badge">{review.startPage}~{review.endPage}쪽</span>
          </div>
        </div>
      </div>

      {review.note && <p className="detail-desc">{review.note}</p>}
      {review.quote && <blockquote className="record-quote">“{review.quote}”</blockquote>}

      <div className="detail-actions">
        <button className={`like-btn ${likedByMe ? 'liked' : ''}`} onClick={handleLike} disabled={!user}>
          ♥ {review.likes.length}
        </button>
        {review.user.id !== user?.id && <ReportButton targetType="review" targetId={review.id} />}
      </div>

      <h3>댓글 {review.comments.length}</h3>
      <ul className="comment-list">
        {review.comments.map((c) => (
          <li key={c.id} className="comment-item">
            <div className="comment-top">
              <strong>{c.user.avatar} {c.user.name}</strong>
              <span className="muted small">{formatDateTime(c.createdAt)}</span>
            </div>
            <p>{c.text}</p>
          </li>
        ))}
        {review.comments.length === 0 && <p className="muted">첫 댓글을 남겨보세요.</p>}
      </ul>

      {user ? (
        <form className="comment-form" onSubmit={handleComment}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="이 서평에 댓글을 남겨보세요" required />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn">댓글 달기</button>
        </form>
      ) : (
        <p className="muted"><Link to="/login">로그인</Link>하면 댓글을 남길 수 있어요.</p>
      )}
    </section>
  );
};

export default ReviewDetailPage;
