import { useState, type FormEvent } from 'react';
import { apiGet, apiPost } from '@/shared/api/client.ts';
import type { BookCandidate } from '@/shared/api/types.ts';

type Props = {
  onImported: () => void; // 책 추가 후 목록 새로고침
};

const BookImportPanel = ({ onImported }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedIsbns, setAddedIsbns] = useState<Set<string>>(new Set());

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      setResults(await apiGet<BookCandidate[]>(`/books/search/external?q=${encodeURIComponent(query)}`));
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (candidate: BookCandidate) => {
    await apiPost('/books/import', candidate);
    setAddedIsbns((prev) => new Set(prev).add(candidate.isbn));
    onImported();
  };

  return (
    <div className="import-panel">
      <button className="btn ghost" onClick={() => setOpen((v) => !v)}>
        {open ? '닫기' : '📚 새 책 추가 (알라딘 검색)'}
      </button>

      {open && (
        <div className="import-body">
          <form className="import-search" onSubmit={handleSearch}>
            <input
              type="search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목·저자·키워드로 알라딘 검색"
              aria-label="제목·저자·키워드로 알라딘 검색"
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? '검색 중…' : '검색'}
            </button>
          </form>

          {error && <p className="error" role="alert">{error}</p>}

          <ul className="import-results">
            {results.map((book, idx) => (
              <li key={`${book.isbn}-${idx}`} className="import-item">
                {book.cover && <img src={book.cover} alt={book.title} className="import-cover" width={44} height={62} loading="lazy" />}
                <div className="import-info">
                  <strong>{book.title}</strong>
                  <p className="muted small">{book.author}</p>
                  <div className="tags">
                    {book.genre && <span className="tag">{book.genre}</span>}
                    {book.category && <span className="tag">{book.category}</span>}
                  </div>
                </div>
                <button
                  className="btn small"
                  onClick={() => handleImport(book)}
                  disabled={addedIsbns.has(book.isbn)}
                >
                  {addedIsbns.has(book.isbn) ? '추가됨' : '추가'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BookImportPanel;
