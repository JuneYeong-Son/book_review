import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '@/shared/api/client.ts';
import type { DiscussionSummary, Progress } from '@/shared/api/types.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';

const DiscussionListPage = () => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [myProgress, setMyProgress] = useState<Progress[]>([]);
  const [bookId, setBookId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const load = () => apiGet<DiscussionSummary[]>('/discussions').then(setDiscussions);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (user) apiGet<Progress[]>('/progress/me').then(setMyProgress).catch(() => setMyProgress([]));
  }, [user]);

  const handleOpen = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await apiPost('/discussions', { bookId, title, description });
      setTitle('');
      setDescription('');
      setBookId('');
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section>
      <div className="page-head">
        <h1>토론</h1>
        <p className="muted">읽었거나 읽는 중인 책에 대해 토론을 열 수 있어요. 토론엔 누구나 댓글로 참여할 수 있어요.</p>
      </div>

      {user && (
        <form className="open-form" onSubmit={handleOpen}>
          <h2>새 토론 열기</h2>
          {myProgress.length === 0 ? (
            <p className="muted">먼저 홈에서 책의 독서 기록을 남기면 그 책으로 토론을 열 수 있어요.</p>
          ) : (
            <>
              <select value={bookId} onChange={(e) => setBookId(e.target.value)} required aria-label="토론할 책 선택">
                <option value="">책 선택 (내가 읽은 책)</option>
                {[...new Map(myProgress.map((p) => [p.bookId, p.book])).values()].map((book) => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </select>
              <input name="title" placeholder="토론 제목" value={title} onChange={(e) => setTitle(e.target.value)} required aria-label="토론 제목" />
              <textarea placeholder="어떤 이야기를 나누고 싶나요?" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} aria-label="토론 설명" />
              {error && <p className="error" role="alert">{error}</p>}
              <button type="submit" className="btn">토론 열기</button>
            </>
          )}
        </form>
      )}

      <ul className="discussion-list">
        {discussions.map((d) => (
          <li key={d.id} className="discussion-item">
            <img src={d.book.cover} alt={d.book.title} className="record-cover" width={54} height={76} loading="lazy" />
            <div className="discussion-main">
              <Link to={`/discussions/${d.id}`} className="discussion-title">{d.title}</Link>
              <p className="muted small">{d.book.title} · {d.owner.name} · 댓글 {d._count.comments}</p>
              {d.description && <p className="discussion-desc">{d.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default DiscussionListPage;
