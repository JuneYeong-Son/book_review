import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '@/shared/api/types.ts';

// 책 카드의 공통 시각 골격(표지 + 제목/저자/태그 + 하단 액션 슬롯).
// 라이브러리 책은 상세로 이동하는 Link(`to`), 외부(아직 id 없는) 추천 책은 콜백(`onOpen`)으로 분기한다.
// 액션 영역(담기·기록 폼 등)은 children으로 합성 → BookCard와 외부추천 카드가 마크업을 공유한다.
type Props = {
  book: Book;
  reason?: string;
  to?: string;
  onOpen?: () => void;
  dismiss?: { onClick: () => void; label: string } | null;
  children?: ReactNode;
};

const BookCardShell = ({ book, reason, to, onOpen, dismiss, children }: Props) => {
  const cover = <img src={book.cover} alt={book.title} className="cover" width={140} height={200} loading="lazy" />;
  return (
    <article className="book-card">
      <div className="cover-wrap">
        {to
          ? <Link to={to}>{cover}</Link>
          : <button className="cover-link" onClick={onOpen} aria-label={`${book.title} 담고 서평 보러가기`}>{cover}</button>}
        {dismiss && <button className="dismiss-btn" onClick={dismiss.onClick} aria-label={dismiss.label}>✕</button>}
      </div>
      <div className="book-body">
        {reason && <p className="reason">{reason}</p>}
        {to
          ? <Link to={to} className="book-title-link"><h3>{book.title}</h3></Link>
          : <button className="book-title-btn" onClick={onOpen}><h3>{book.title}</h3></button>}
        <p className="author">{book.author}</p>
        <div className="tags">
          {book.genre && <span className="tag">{book.genre}</span>}
          {book.category && <span className="tag">{book.category}</span>}
        </div>
        {children}
      </div>
    </article>
  );
};

export default BookCardShell;
