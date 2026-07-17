import { useState } from 'react';
import type { Book, Progress } from '@/shared/api/types.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import BookCardShell from '@/entities/book_card_shell.tsx';

type Props = {
  book: Book;
  latest?: Progress; // 이 책에 대한 내 최신 기록
  interested: boolean;
  reason?: string; // 추천 이유 (추천 섹션에서만 표시)
  onDismiss?: () => void; // 추천 제외(X)
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

const BookCard = ({ book, latest, interested, reason, onDismiss, onToggleInterest, onSaveProgress }: Props) => {
  // 로그인 여부는 컨텍스트에서 직접 읽는다(부모의 loggedIn prop drilling 제거).
  const loggedIn = Boolean(useAuth().user);
  const [open, setOpen] = useState(false);
  // 이어 읽기 편하도록 시작 페이지는 최신 기록의 끝 페이지로 기본 설정
  const [startPage, setStartPage] = useState(latest?.endPage ?? 0);
  const [endPage, setEndPage] = useState(latest?.endPage ?? 0);
  const [note, setNote] = useState('');
  const [quote, setQuote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveProgress(book.id, Number(startPage), Number(endPage), note, quote, 0);
      setNote('');
      setQuote('');
      setStartPage(Number(endPage));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BookCardShell
      book={book}
      reason={reason}
      to={`/books/${book.id}`}
      dismiss={onDismiss ? { onClick: onDismiss, label: '이 책 추천 안 받기' } : null}
    >
      {latest && (
        <div className="my-progress">
          <span className="page-badge">
            {latest.startPage}~{latest.endPage}쪽
          </span>
        </div>
      )}

      {/* 내 서재에 없으면 먼저 담기, 담은 뒤에야 서평 쓰기 노출.
          .card-action full 로 카드 하단에 폭 맞춰 정렬(카드마다 위치 통일). */}
      {loggedIn && !interested && (
        <button className="btn small full card-action" onClick={() => onToggleInterest(book.id)}>
          ＋ 내 서재에 추가
        </button>
      )}
      {loggedIn && interested && (
        <button className="btn ghost small full card-action" onClick={() => setOpen((v) => !v)}>
          {open ? '닫기' : '독서 기록·서평 쓰기'}
        </button>
      )}

      {open && (
        <div className="record-form">
          <label className="row">
            <span>어디부터 어디까지 읽었나요? (쪽)</span>
            <span className="page-range">
              <input
                type="number"
                min={0}
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                aria-label="시작 쪽"
              />
              <span>~</span>
              <input
                type="number"
                min={0}
                value={endPage}
                onChange={(e) => setEndPage(Number(e.target.value))}
                aria-label="끝 쪽"
              />
            </span>
          </label>
          <label className="row">
            <span>서평</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              minLength={10}
              placeholder="이 책에 대한 생각을 남겨보세요 (10자 이상, 비우면 쪽수만 기록)"
            />
          </label>
          <label className="row">
            <span>
              인상깊은 글귀 <em className="optional">(선택)</em>
            </span>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={2}
              placeholder="마음에 남은 문장을 적어보세요"
            />
          </label>
          <button className="btn full" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중…' : '기록 추가'}
          </button>
        </div>
      )}
    </BookCardShell>
  );
};

export default BookCard;
