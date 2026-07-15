import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/client.ts';
import type { Progress } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import StarRating from '../component/star_rating.tsx';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

const RecordsPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<Progress[]>([]);
  const [keyword, setKeyword] = useState('');

  const load = () => apiGet<Progress[]>('/progress').then(setRecords);

  useEffect(() => {
    load();
  }, []);

  const handleLike = async (progressId: string) => {
    if (!user) return;
    await apiPost(`/progress/${progressId}/like`);
    load();
  };

  // 책 제목 · 저자 · 작성자(작성한 사람) 이름 기준으로 검색
  const query = keyword.trim().toLowerCase();
  const filtered = query
    ? records.filter((record) =>
        [record.book.title, record.book.author, record.user.name]
          .some((field) => field.toLowerCase().includes(query))
      )
    : records;

  return (
    <section>
      <div className="page-head">
        <h1>독서 기록</h1>
        <p className="muted">모두의 독서 기록과 서평을 볼 수 있어요.</p>
      </div>

      <input
        className="search-input"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="책 제목, 저자, 작성자 이름으로 검색"
      />

      {records.length === 0 && <p className="muted">아직 기록이 없어요.</p>}
      {records.length > 0 && filtered.length === 0 && (
        <p className="muted">'{keyword}'에 대한 검색 결과가 없어요.</p>
      )}

      <ul className="record-list">
        {filtered.map((record) => (
          <li key={record.id} className="record-item">
            <img src={record.book.cover} alt={record.book.title} className="record-cover" />
            <div className="record-main">
              <div className="record-top">
                <strong>{record.book.title}</strong>
                <span className="muted"> · {record.user.avatar} {record.user.name}</span>
              </div>
              <div className="record-meta">
                <StarRating value={record.rating} size={16} />
                <span className="page-badge">{record.startPage}~{record.endPage}쪽</span>
                <span className="muted small">{formatDate(record.createdAt)}</span>
              </div>
              {record.note && <p className="record-note">{record.note}</p>}
              {record.quote && <blockquote className="record-quote">“{record.quote}”</blockquote>}
              <button
                className={`like-btn ${record.likes.some((l) => l.userId === user?.id) ? 'liked' : ''}`}
                onClick={() => handleLike(record.id)}
                disabled={!user}
                title={user ? '좋아요' : '로그인 후 좋아요를 누를 수 있어요'}
              >
                ♥ {record.likes.length}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RecordsPage;
