import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client.ts';
import type { DiscussionDetail } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import ReportButton from '../component/report_button.tsx';

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('ko-KR');

const DiscussionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    if (id) apiGet<DiscussionDetail>(`/discussions/${id}`).then(setDiscussion).catch(() => setDiscussion(null));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleComment = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await apiPost(`/discussions/${id}/comments`, { text });
      setText('');
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!discussion) return <p className="muted">토론을 불러오는 중...</p>;

  return (
    <section className="discussion-detail">
      <Link to="/discussions" className="muted small">← 토론 목록</Link>
      <div className="detail-head">
        <img src={discussion.book.cover} alt={discussion.book.title} className="record-cover" />
        <div>
          <h1>{discussion.title}</h1>
          <p className="muted">{discussion.book.title} · {discussion.book.author}</p>
          <p className="muted small">{discussion.owner.name}님이 열었어요 · {formatDateTime(discussion.createdAt)}</p>
        </div>
      </div>
      {discussion.description && <p className="detail-desc">{discussion.description}</p>}

      {discussion.owner.id !== user?.id && (
        <div className="detail-actions">
          <ReportButton targetType="discussion" targetId={discussion.id} />
        </div>
      )}

      <h3>댓글 {discussion.comments.length}</h3>
      <ul className="comment-list">
        {discussion.comments.map((comment) => (
          <li key={comment.id} className="comment-item">
            <div className="comment-top">
              <strong>{comment.user.name}</strong>
              <span className="muted small">{formatDateTime(comment.createdAt)}</span>
            </div>
            <p>{comment.text}</p>
          </li>
        ))}
        {discussion.comments.length === 0 && <p className="muted">첫 댓글을 남겨보세요.</p>}
      </ul>

      {user ? (
        <form className="comment-form" onSubmit={handleComment}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="댓글을 입력하세요" required />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn">댓글 달기</button>
        </form>
      ) : (
        <p className="muted"><Link to="/login">로그인</Link>하면 토론에 참여할 수 있어요.</p>
      )}
    </section>
  );
};

export default DiscussionDetailPage;
