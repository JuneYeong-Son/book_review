import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Book, Progress } from '../api/types.ts';
import StarRating from './star_rating.tsx';

type Props = {
  book: Book;
  latest?: Progress; // 이 책에 대한 내 최신 기록
  interested: boolean;
  loggedIn: boolean;
  reason?: string; // 추천 이유 (추천 섹션에서만 표시)
  onToggleInterest: (bookId: string) => void;
  onSaveProgress: (
    bookId: string,
    startPage: number,
    endPage: number,
    note: string,
    quote: string,
    rating: number
  ) => Promise<void>;
};

const BookCard = ({ book, latest, interested, loggedIn, reason, onToggleInterest, onSaveProgress }: Props) => {
  const [open, setOpen] = useState(false);
  // 이어 읽기 편하도록 시작 페이지는 최신 기록의 끝 페이지로 기본 설정
  const [startPage, setStartPage] = useState(latest?.endPage ?? 0);
  const [endPage, setEndPage] = useState(latest?.endPage ?? 0);
  const [note, setNote] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(latest?.rating ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveProgress(book.id, Number(startPage), Number(endPage), note, quote, rating);
      setNote('');
      setQuote('');
      setStartPage(Number(endPage));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="book-card">
      <div className="cover-wrap">
        <Link to={`/books/${book.id}`}><img src={book.cover} alt={book.title} className="cover" /></Link>
      </div>

      <div className="book-body">
        {reason && <p className="reason">{reason}</p>}
        <Link to={`/books/${book.id}`} className="book-title-link"><h3>{book.title}</h3></Link>
        <p className="author">{book.author}</p>
        <div className="tags">
          {book.genre && <span className="tag">{book.genre}</span>}
          {book.category && <span className="tag">{book.category}</span>}
        </div>

        {latest && (
          <div className="my-progress">
            <StarRating value={latest.rating} size={16} />
            <span className="page-badge">{latest.startPage}~{latest.endPage}쪽</span>
          </div>
        )}

        {/* 내 서재에 없으면 먼저 담기, 담은 뒤에야 서평 쓰기 노출 */}
        {loggedIn && !interested && (
          <button className="btn small" onClick={() => onToggleInterest(book.id)}>＋ 내 서재에 추가</button>
        )}
        {loggedIn && interested && (
          <button className="btn ghost small" onClick={() => setOpen((v) => !v)}>
            {open ? '닫기' : '독서 기록·서평 쓰기'}
          </button>
        )}

        {open && (
          <div className="record-form">
            <label className="row">
              <span>어디부터 어디까지 읽었나요? (쪽)</span>
              <span className="page-range">
                <input type="number" min={0} value={startPage} onChange={(e) => setStartPage(Number(e.target.value))} />
                <span>~</span>
                <input type="number" min={0} value={endPage} onChange={(e) => setEndPage(Number(e.target.value))} />
              </span>
            </label>
            <label className="row">
              <span>별점</span>
              <StarRating value={rating} onChange={setRating} size={24} />
            </label>
            <label className="row">
              <span>서평</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="이 책에 대한 생각을 남겨보세요" />
            </label>
            <label className="row">
              <span>인상깊은 글귀 <em className="optional">(선택)</em></span>
              <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={2} placeholder="마음에 남은 문장을 적어보세요" />
            </label>
            <button className="btn full" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '기록 추가'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default BookCard;
