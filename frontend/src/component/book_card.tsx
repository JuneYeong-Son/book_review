import { useState } from 'react';
import type { Book, Progress } from '../api/types.ts';
import StarRating from './star_rating.tsx';

type Props = {
  book: Book;
  myProgress?: Progress;
  interested: boolean;
  loggedIn: boolean;
  onToggleInterest: (bookId: string) => void;
  onSaveProgress: (bookId: string, page: number, note: string, rating: number) => Promise<void>;
};

const BookCard = ({ book, myProgress, interested, loggedIn, onToggleInterest, onSaveProgress }: Props) => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(myProgress?.page ?? 0);
  const [note, setNote] = useState(myProgress?.note ?? '');
  const [rating, setRating] = useState(myProgress?.rating ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveProgress(book.id, Number(page), note, rating);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="book-card">
      <div className="cover-wrap">
        <img src={book.cover} alt={book.title} className="cover" />
        {loggedIn && (
          <button
            className={`interest ${interested ? 'on' : ''}`}
            onClick={() => onToggleInterest(book.id)}
            title="관심 책"
          >
            {interested ? '♥' : '♡'}
          </button>
        )}
      </div>

      <div className="book-body">
        <h3>{book.title}</h3>
        <p className="author">{book.author}</p>
        <div className="tags">
          {book.genre && <span className="tag">{book.genre}</span>}
          {book.category && <span className="tag">{book.category}</span>}
        </div>

        {myProgress && (
          <div className="my-progress">
            <StarRating value={myProgress.rating} size={16} />
            <span className="page-badge">{myProgress.page}쪽까지</span>
          </div>
        )}

        {loggedIn && (
          <button className="btn ghost small" onClick={() => setOpen((v) => !v)}>
            {open ? '닫기' : myProgress ? '기록 수정' : '독서 기록·서평 쓰기'}
          </button>
        )}

        {open && (
          <div className="record-form">
            <label className="row">
              <span>어디까지 읽었나요? (쪽)</span>
              <input type="number" min={0} value={page} onChange={(e) => setPage(Number(e.target.value))} />
            </label>
            <label className="row">
              <span>별점</span>
              <StarRating value={rating} onChange={setRating} size={24} />
            </label>
            <label className="row">
              <span>서평</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="이 책에 대한 생각을 남겨보세요" />
            </label>
            <button className="btn full" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default BookCard;
