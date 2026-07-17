import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/api/client.ts';
import type { ReviewDetail } from '@/shared/api/types.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import { displayName } from '@/shared/lib/display.ts';
import ReportButton from '@/features/report_button.tsx';

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('ko-KR');

const ReviewDetailPage = () => {
  const { bookId, seq } = useParams<{ bookId: string; seq: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const id = review?.id; // 좋아요/댓글/수정/삭제는 실제 서평 id로

  // 수정 모드
  const [editing, setEditing] = useState(false);
  const [startPage, setStartPage] = useState(0);
  const [endPage, setEndPage] = useState(0);
  const [note, setNote] = useState('');
  const [quote, setQuote] = useState('');

  const load = () => {
    if (bookId && seq)
      apiGet<ReviewDetail>(`/progress/book/${bookId}/seq/${seq}`)
        .then(setReview)
        .catch(() => setReview(null));
  };

  useEffect(() => {
    load();
  }, [bookId, seq]);

  const startEdit = () => {
    if (!review) return;
    setStartPage(review.startPage);
    setEndPage(review.endPage);
    setNote(review.note);
    setQuote(review.quote);
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await apiPatch(`/progress/${id}`, { startPage: Number(startPage), endPage: Number(endPage), note, quote });
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const removeReview = async () => {
    if (!window.confirm('이 서평을 삭제할까요?')) return;
    await apiDelete(`/progress/${id}`);
    navigate('/records');
  };

  const handleLike = async () => {
    if (!user || !id) return;
    await apiPost(`/progress/${id}/like`);
    load();
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setCommenting(true);
    try {
      await apiPost(`/progress/${id}/comments`, { text });
      setText('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCommenting(false);
    }
  };

  if (!review) return <p className="muted">서평을 불러오는 중…</p>;

  const likedByMe = review.likes.some((l) => l.userId === user?.id);
  const isMine = review.user.id === user?.id;

  return (
    <section className="review-detail">
      <Link to="/records" className="muted small">
        ← 독서 기록
      </Link>
      <div className="book-detail-head">
        <Link to={`/books/${review.book.id}`}>
          <img
            src={review.book.cover}
            alt={review.book.title}
            className="book-detail-cover"
            width={82}
            height={116}
            loading="lazy"
          />
        </Link>
        <div className="book-detail-info">
          <p className="context-label">이 서평이 다룬 책</p>
          <Link to={`/books/${review.book.id}`}>
            <h1>{review.book.title}</h1>
          </Link>
          <p className="author">{review.book.author}</p>
        </div>
      </div>

      {editing ? (
        <div className="record-form">
          <label className="row">
            <span>어디부터 어디까지 읽었나요? (쪽)</span>
            <span className="page-range">
              <input
                type="number"
                min={0}
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                aria-label="시작 쪽"
              />
              <span>~</span>
              <input
                type="number"
                min={0}
                value={endPage}
                onChange={(e) => setEndPage(Number(e.target.value))}
                aria-label="끝 쪽"
              />
            </span>
          </label>
          <label className="row">
            <span>서평</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </label>
          <label className="row">
            <span>
              인상깊은 글귀 <em className="optional">(선택)</em>
            </span>
            <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={2} />
          </label>
          <div className="edit-actions">
            <button className="btn small" onClick={saveEdit} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
            <button className="btn ghost small" onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="review-content">
          <div className="review-byline">
            <span className="review-eyebrow">서평</span>
            <span className="muted small">
              {review.user.avatar}{' '}
              <Link to={`/users/${review.user.id}`} className="user-link">
                {displayName(review.user)}
              </Link>
              {' · '}
              {formatDateTime(review.createdAt)}
              {' · '}
              {review.startPage}~{review.endPage}쪽
              {!isMine && (
                <>
                  {' '}
                  · <ReportButton targetType="user" targetId={review.user.id} label="사용자 신고" />
                </>
              )}
            </span>
          </div>
          {review.note ? (
            <p className="review-body">{review.note}</p>
          ) : (
            <p className="muted">남긴 글이 없는 기록이에요.</p>
          )}
          {review.quote && <blockquote className="record-quote">“{review.quote}”</blockquote>}
        </div>
      )}

      <div className="detail-actions">
        <button
          className={`like-btn ${likedByMe ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!user}
          aria-label={likedByMe ? '좋아요 취소' : '좋아요'}
        >
          ♥ {review.likes.length}
        </button>
        {isMine && !editing && (
          <>
            <button className="btn ghost small" onClick={startEdit}>
              수정
            </button>
            <button className="btn ghost small danger-text" onClick={removeReview}>
              삭제
            </button>
          </>
        )}
        {!isMine && <ReportButton targetType="review" targetId={review.id} />}
      </div>

      <h2 className="comments-title">댓글 {review.comments.length}</h2>
      <ul className="comment-list">
        {review.comments.map((c) => (
          <li key={c.id} className="comment-item">
            <div className="comment-top">
              <Link to={`/users/${c.user.id}`} className="user-link">
                <strong>
                  {c.user.avatar} {displayName(c.user)}
                </strong>
              </Link>
              <span className="muted small">{formatDateTime(c.createdAt)}</span>
            </div>
            <p>{c.text}</p>
          </li>
        ))}
        {review.comments.length === 0 && <p className="muted">첫 댓글을 남겨보세요.</p>}
      </ul>

      {user ? (
        <form className="comment-form" onSubmit={handleComment}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="이 서평에 댓글을 남겨보세요…"
            required
            aria-label="댓글 입력"
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn" disabled={commenting}>
            {commenting ? '등록 중…' : '댓글 달기'}
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link to="/login">로그인</Link>하면 댓글을 남길 수 있어요.
        </p>
      )}
    </section>
  );
};

export default ReviewDetailPage;
