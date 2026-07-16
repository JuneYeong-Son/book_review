import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { apiGet, apiPatch, apiDelete, apiPost } from '@/shared/api/client.ts';
import type { Interest, Progress } from '@/shared/api/types.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import StarRating from '@/entities/star_rating.tsx';

const formatDate = (iso: string) => new Date(iso).toLocaleString('ko-KR');

const MyBookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const [records, setRecords] = useState<Progress[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [interested, setInterested] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const load = () => {
    if (!user || !bookId) return;
    apiGet<Progress[]>(`/progress/me/book/${bookId}`).then(setRecords).catch(() => setRecords([])).finally(() => setLoaded(true));
    apiGet<Interest[]>('/books/interests/me')
      .then((list) => setInterested(list.some((i) => i.bookId === bookId)))
      .catch(() => setInterested(false));
  };

  useEffect(() => { load(); }, [user, bookId]);

  if (!user) return <Navigate to="/login" replace />;
  if (!loaded) return <p className="muted">불러오는 중…</p>;

  const book = records[0]?.book;

  const toggleInterest = async () => {
    await apiPost(`/books/${bookId}/interest`);
    load();
  };
  const remove = async (id: string) => {
    if (!window.confirm('이 서평을 삭제할까요?')) return;
    await apiDelete(`/progress/${id}`);
    load();
  };

  return (
    <section>
      <Link to="/mypage" className="muted small">← 마이페이지</Link>

      {book ? (
        <div className="detail-head">
          <img src={book.cover} alt={book.title} className="record-cover" width={54} height={76} />
          <div>
            <h1>{book.title}</h1>
            <p className="muted">{book.author}</p>
            <button className={`btn ghost small ${interested ? 'interested-btn' : ''}`} onClick={toggleInterest}>
              {interested ? '♥ 관심 책' : '♡ 관심 책으로'}
            </button>
          </div>
        </div>
      ) : (
        <p className="muted">이 책에 대한 기록이 없어요.</p>
      )}

      <h2 className="section-title">날짜별 서평 ({records.length})</h2>
      <ul className="timeline">
        {records.map((r) =>
          editing === r.id ? (
            <li key={r.id} className="timeline-item">
              <EditForm record={r} onDone={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li key={r.id} className="timeline-item">
              <div className="timeline-date">{formatDate(r.createdAt)}</div>
              <div className="timeline-body">
                <div className="record-meta">
                  <span className="page-badge">{r.startPage}~{r.endPage}쪽</span>
                </div>
                {r.note && <p className="record-note">{r.note}</p>}
                {r.quote && <blockquote className="record-quote">“{r.quote}”</blockquote>}
                <div className="edit-actions">
                  <button className="btn ghost small" onClick={() => setEditing(r.id)}>수정</button>
                  <button className="btn ghost small danger-text" onClick={() => remove(r.id)}>삭제</button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>
    </section>
  );
};

// 서평 수정 인라인 폼
const EditForm = ({ record, onDone, onCancel }: { record: Progress; onDone: () => void; onCancel: () => void }) => {
  const [startPage, setStartPage] = useState(record.startPage);
  const [endPage, setEndPage] = useState(record.endPage);
  const [note, setNote] = useState(record.note);
  const [quote, setQuote] = useState(record.quote);

  const save = async () => {
    await apiPatch(`/progress/${record.id}`, {
      startPage: Number(startPage), endPage: Number(endPage), note, quote
    });
    onDone();
  };

  return (
    <div className="record-form" style={{ flex: 1 }}>
      <label className="row"><span>쪽</span>
        <span className="page-range">
          <input type="number" min={0} value={startPage} onChange={(e) => setStartPage(Number(e.target.value))} />
          <span>~</span>
          <input type="number" min={0} value={endPage} onChange={(e) => setEndPage(Number(e.target.value))} />
        </span>
      </label>
      <label className="row"><span>서평</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></label>
      <label className="row"><span>글귀</span><textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={2} /></label>
      <div className="edit-actions">
        <button className="btn small" onClick={save}>저장</button>
        <button className="btn ghost small" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
};

export default MyBookPage;
