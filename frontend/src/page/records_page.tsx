import { useEffect, useState } from 'react';
import { apiGet } from '../api/client.ts';
import type { Progress } from '../api/types.ts';
import StarRating from '../component/star_rating.tsx';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

const RecordsPage = () => {
  const [records, setRecords] = useState<Progress[]>([]);

  useEffect(() => {
    apiGet<Progress[]>('/progress').then(setRecords);
  }, []);

  return (
    <section>
      <div className="page-head">
        <h1>독서 기록</h1>
        <p className="muted">모두의 독서 기록과 서평을 볼 수 있어요.</p>
      </div>

      {records.length === 0 && <p className="muted">아직 기록이 없어요.</p>}

      <ul className="record-list">
        {records.map((record) => (
          <li key={record.id} className="record-item">
            <img src={record.book.cover} alt={record.book.title} className="record-cover" />
            <div className="record-main">
              <div className="record-top">
                <strong>{record.book.title}</strong>
                <span className="muted"> · {record.user.name}</span>
              </div>
              <div className="record-meta">
                <StarRating value={record.rating} size={16} />
                <span className="page-badge">{record.page}쪽까지</span>
                <span className="muted small">{formatDate(record.updatedAt)}</span>
              </div>
              {record.note && <p className="record-note">{record.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RecordsPage;
