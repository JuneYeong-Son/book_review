import { useEffect, useState, type FormEvent } from 'react';
import { apiGet, apiPost } from '../api/client.ts';
import type { Book, Interest, Progress } from '../api/types.ts';
import StarRating from './star_rating.tsx';
import Modal from './modal.tsx';

type Props = {
  onChange: () => void; // 작업 후 상위 데이터 새로고침
};

type Which = 'review' | 'interest' | 'discussion' | null;

const QuickActions = ({ onChange }: Props) => {
  const [which, setWhich] = useState<Which>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);

  const loadInterests = () =>
    apiGet<Interest[]>('/books/interests/me').then(setInterests).catch(() => setInterests([]));

  useEffect(() => {
    apiGet<Book[]>('/books').then(setBooks).catch(() => setBooks([]));
    apiGet<Progress[]>('/progress/me')
      .then((p) => setMyBooks([...new Map(p.map((r) => [r.bookId, r.book])).values()]))
      .catch(() => setMyBooks([]));
    loadInterests();
  }, [which]);

  // --- 서평 쓰기 ---
  const [rBook, setRBook] = useState('');
  const [rStart, setRStart] = useState(0);
  const [rEnd, setREnd] = useState(0);
  const [rRating, setRRating] = useState(0);
  const [rNote, setRNote] = useState('');
  const [rQuote, setRQuote] = useState('');
  const [rErr, setRErr] = useState('');

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    setRErr('');
    try {
      await apiPost('/progress', {
        bookId: rBook,
        startPage: Number(rStart),
        endPage: Number(rEnd),
        note: rNote,
        quote: rQuote,
        rating: rRating
      });
      setWhich(null);
      setRBook(''); setRStart(0); setREnd(0); setRRating(0); setRNote(''); setRQuote('');
      onChange();
    } catch (err) {
      setRErr((err as Error).message);
    }
  };

  // --- 토론 열기 ---
  const [dBook, setDBook] = useState('');
  const [dTitle, setDTitle] = useState('');
  const [dDesc, setDDesc] = useState('');
  const [dErr, setDErr] = useState('');

  const submitDiscussion = async (e: FormEvent) => {
    e.preventDefault();
    setDErr('');
    try {
      await apiPost('/discussions', { bookId: dBook, title: dTitle, description: dDesc });
      setWhich(null);
      setDBook(''); setDTitle(''); setDDesc('');
      onChange();
    } catch (err) {
      setDErr((err as Error).message);
    }
  };

  // --- 관심 책 추가 ---
  const interestedIds = new Set(interests.map((i) => i.bookId));
  const toggleInterest = async (bookId: string) => {
    await apiPost(`/books/${bookId}/interest`);
    await loadInterests();
    onChange();
  };

  return (
    <div className="quick-actions">
      <button className="btn" onClick={() => setWhich('review')}>✍️ 서평 쓰기</button>
      <button className="btn ghost" onClick={() => setWhich('interest')}>♡ 관심 책 추가</button>
      <button className="btn ghost" onClick={() => setWhich('discussion')}>💬 토론 열기</button>

      {which === 'review' && (
        <Modal title="서평 쓰기" onClose={() => setWhich(null)}>
          <form className="modal-form" onSubmit={submitReview}>
            <label>책
              <select value={rBook} onChange={(e) => setRBook(e.target.value)} required>
                <option value="">책 선택</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </label>
            <label>어디부터 어디까지 읽었나요? (쪽)
              <span className="page-range">
                <input type="number" min={0} value={rStart} onChange={(e) => setRStart(Number(e.target.value))} />
                <span>~</span>
                <input type="number" min={0} value={rEnd} onChange={(e) => setREnd(Number(e.target.value))} />
              </span>
            </label>
            <label>별점
              <StarRating value={rRating} onChange={setRRating} size={24} />
            </label>
            <label>서평
              <textarea value={rNote} onChange={(e) => setRNote(e.target.value)} rows={3} />
            </label>
            <label>인상깊은 글귀 <em className="optional">(선택)</em>
              <textarea value={rQuote} onChange={(e) => setRQuote(e.target.value)} rows={2} />
            </label>
            {rErr && <p className="error">{rErr}</p>}
            <button type="submit" className="btn full">저장</button>
          </form>
        </Modal>
      )}

      {which === 'interest' && (
        <Modal title="관심 책 추가" onClose={() => setWhich(null)}>
          <ul className="interest-picker">
            {books.map((b) => (
              <li key={b.id}>
                <img src={b.cover} alt={b.title} className="import-cover" />
                <span className="interest-title">{b.title}</span>
                <button
                  className={`interest ${interestedIds.has(b.id) ? 'on' : ''}`}
                  onClick={() => toggleInterest(b.id)}
                >
                  {interestedIds.has(b.id) ? '♥' : '♡'}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {which === 'discussion' && (
        <Modal title="토론 열기" onClose={() => setWhich(null)}>
          {myBooks.length === 0 ? (
            <p className="muted">먼저 책의 독서 기록(서평)을 남기면 그 책으로 토론을 열 수 있어요.</p>
          ) : (
            <form className="modal-form" onSubmit={submitDiscussion}>
              <label>책 (내가 읽은 책)
                <select value={dBook} onChange={(e) => setDBook(e.target.value)} required>
                  <option value="">책 선택</option>
                  {myBooks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              </label>
              <label>제목
                <input value={dTitle} onChange={(e) => setDTitle(e.target.value)} required />
              </label>
              <label>설명
                <textarea value={dDesc} onChange={(e) => setDDesc(e.target.value)} rows={3} />
              </label>
              {dErr && <p className="error">{dErr}</p>}
              <button type="submit" className="btn full">토론 열기</button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default QuickActions;
