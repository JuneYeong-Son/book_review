import { useEffect, useState, type FormEvent } from 'react';
import { apiGet, apiPost } from '../api/client.ts';
import type { Book, BookCandidate, Interest, Progress } from '../api/types.ts';
import StarRating from './star_rating.tsx';
import Modal from './modal.tsx';

type Props = {
  onChange: () => void;
};

type Which = 'review' | 'book' | 'discussion' | null;

const QuickActions = ({ onChange }: Props) => {
  const [which, setWhich] = useState<Which>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);

  const loadBooks = () => apiGet<Book[]>('/books').then(setBooks).catch(() => setBooks([]));
  const loadInterests = () =>
    apiGet<Interest[]>('/books/interests/me').then(setInterests).catch(() => setInterests([]));

  useEffect(() => {
    loadBooks();
    apiGet<Progress[]>('/progress/me')
      .then((p) => setMyBooks([...new Map(p.map((r) => [r.bookId, r.book])).values()]))
      .catch(() => setMyBooks([]));
    loadInterests();
  }, [which]);

  const interestedIds = new Set(interests.map((i) => i.bookId));

  // --- 서평 쓰기 ---
  const [rBook, setRBook] = useState('');
  const [rStart, setRStart] = useState(0);
  const [rEnd, setREnd] = useState(0);
  const [rNote, setRNote] = useState('');
  const [rQuote, setRQuote] = useState('');
  const [rErr, setRErr] = useState('');

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    setRErr('');
    try {
      await apiPost('/progress', {
        bookId: rBook, startPage: Number(rStart), endPage: Number(rEnd),
        note: rNote, quote: rQuote, rating: 0
      });
      setWhich(null);
      setRBook(''); setRStart(0); setREnd(0); setRNote(''); setRQuote('');
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

  // --- 책 추가·관심 (알라딘 검색 임포트 + 관심 지정 통합) ---
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  const searchAladin = async (e: FormEvent) => {
    e.preventDefault();
    setSearchErr('');
    setSearching(true);
    try {
      setResults(await apiGet<BookCandidate[]>(`/books/search/external?q=${encodeURIComponent(query)}`));
    } catch (err) {
      setSearchErr((err as Error).message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 검색 결과 추가 → 임포트 후 관심 책으로도 지정
  const addAndInterest = async (candidate: BookCandidate) => {
    const book = await apiPost<Book>('/books/import', candidate);
    if (!interestedIds.has(book.id)) await apiPost(`/books/${book.id}/interest`);
    await loadBooks();
    await loadInterests();
    onChange();
  };

  const toggleInterest = async (bookId: string) => {
    await apiPost(`/books/${bookId}/interest`);
    await loadInterests();
    onChange();
  };

  return (
    <div className="quick-actions">
      <button className="btn" onClick={() => setWhich('review')}>✍️ 서평 쓰기</button>
      <button className="btn ghost" onClick={() => setWhich('book')}>📚 내 서재에 추가</button>
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
            <label>서평 <textarea value={rNote} onChange={(e) => setRNote(e.target.value)} rows={3} /></label>
            <label>인상깊은 글귀 <em className="optional">(선택)</em>
              <textarea value={rQuote} onChange={(e) => setRQuote(e.target.value)} rows={2} />
            </label>
            {rErr && <p className="error" role="alert">{rErr}</p>}
            <button type="submit" className="btn full">저장</button>
          </form>
        </Modal>
      )}

      {which === 'book' && (
        <Modal title="내 서재에 추가" onClose={() => setWhich(null)}>
          <form className="import-search" onSubmit={searchAladin}>
            <input type="search" name="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="알라딘에서 책 검색 (제목·저자)" aria-label="알라딘에서 책 검색" />
            <button type="submit" className="btn" disabled={searching}>{searching ? '검색 중' : '검색'}</button>
          </form>
          {searchErr && <p className="error" role="alert">{searchErr}</p>}
          {results.length > 0 && (
            <ul className="import-results">
              {results.map((b, i) => (
                <li key={`${b.isbn}-${i}`} className="import-item">
                  {b.cover && <img src={b.cover} alt={b.title} className="import-cover" width={44} height={62} loading="lazy" />}
                  <div className="import-info">
                    <strong>{b.title}</strong>
                    <p className="muted small">{b.author}</p>
                  </div>
                  <button className="btn small" onClick={() => addAndInterest(b)}>내 서재에 담기</button>
                </li>
              ))}
            </ul>
          )}

          <p className="muted small picker-hint">
            검색해서 새 책을 서재에 담아보세요. 이미 담은 책은 마이페이지 &gt; 내 서재에서 관리할 수 있어요.
          </p>
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
              <label>제목 <input value={dTitle} onChange={(e) => setDTitle(e.target.value)} required /></label>
              <label>설명 <textarea value={dDesc} onChange={(e) => setDDesc(e.target.value)} rows={3} /></label>
              {dErr && <p className="error" role="alert">{dErr}</p>}
              <button type="submit" className="btn full">토론 열기</button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default QuickActions;
