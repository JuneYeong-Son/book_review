import { useNotices } from '@/shared/api/hooks.ts';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

const NoticesPage = () => {
  const { data: notices = [], isLoading } = useNotices();

  return (
    <section>
      <div className="page-head">
        <h1>공지사항</h1>
      </div>

      {isLoading ? (
        <p className="muted">불러오는 중…</p>
      ) : notices.length === 0 ? (
        <p className="muted">등록된 공지가 없어요.</p>
      ) : (
        <ul className="notice-list">
          {notices.map((n) => (
            <li key={n.id} className={`notice-item ${n.pinned ? 'pinned' : ''}`}>
              <div className="notice-head">
                {n.pinned && <span className="notice-pin">📌 고정</span>}
                <h2 className="notice-title">{n.title}</h2>
                <span className="muted small notice-date">{formatDate(n.createdAt)}</span>
              </div>
              <p className="notice-body">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default NoticesPage;
