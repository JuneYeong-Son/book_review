import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { apiGet } from '../api/client.ts';
import type { Progress } from '../api/types.ts';
import { useAuth } from '../lib/auth_context.tsx';
import StarRating from '../component/star_rating.tsx';

const formatDate = (iso: string) => new Date(iso).toLocaleString('ko-KR');

const MyBookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const [records, setRecords] = useState<Progress[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !bookId) return;
    apiGet<Progress[]>(`/progress/me/book/${bookId}`)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoaded(true));
  }, [user, bookId]);

  if (!user) return <Navigate to="/login" replace />;
  if (!loaded) return <p className="muted">불러오는 중...</p>;

  const book = records[0]?.book;

  return (
    <section>
      <Link to="/mypage" className="muted small">← 마이페이지</Link>

      {book ? (
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
      ) : (
        <p className="muted">이 책에 대한 기록이 없어요.</p>
      )}

      <h2 className="section-title">날짜별 서평 ({records.length})</h2>
      <ul className="timeline">
        {records.map((record) => (
          <li key={record.id} className="timeline-item">
            <div className="timeline-date">{formatDate(record.createdAt)}</div>
            <div className="timeline-body">
              <div className="record-meta">
                <StarRating value={record.rating} size={16} />
                <span className="page-badge">{record.startPage}~{record.endPage}쪽</span>
              </div>
              {record.note && <p className="record-note">{record.note}</p>}
              {record.quote && <blockquote className="record-quote">“{record.quote}”</blockquote>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default MyBookPage;
