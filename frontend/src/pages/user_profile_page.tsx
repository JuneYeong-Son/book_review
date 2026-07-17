import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '@/shared/api/client.ts';
import type { UserProfile } from '@/shared/api/types.ts';
import { displayName } from '@/shared/lib/display.ts';

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiGet<UserProfile>(`/users/${id}`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoaded(true));
  }, [id]);

  if (!loaded) return <p className="muted">불러오는 중…</p>;
  if (!profile) return <p className="muted">사용자를 찾을 수 없어요.</p>;

  const { user, reviews, interests, discussions } = profile;

  return (
    <section>
      <div className="profile-head">
        <span className="profile-avatar">{user.avatar}</span>
        <h1>{displayName(user)}</h1>
      </div>

      <h2 className="section-title">서평 ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p className="muted">아직 서평이 없어요.</p>
      ) : (
        <ul className="record-list">
          {reviews.map((r) => (
            <li key={r.id} className="record-item">
              <img
                src={r.book.cover}
                alt={r.book.title}
                className="record-cover"
                width={54}
                height={76}
                loading="lazy"
              />
              <div className="record-main">
                <Link to={`/books/${r.bookId}/reviews/${r.bookSeq}`}>
                  <strong>{r.book.title}</strong>
                </Link>
                <div className="record-meta">
                  <span className="page-badge">
                    {r.startPage}~{r.endPage}쪽
                  </span>
                  <span className="like-count">♥ {r.likes.length}</span>
                </div>
                {r.note && <p className="record-note">{r.note}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">서재 ({interests.length})</h2>
      {interests.length === 0 ? (
        <p className="muted">서재에 담은 책이 없어요.</p>
      ) : (
        <div className="book-grid">
          {interests.map((it) => (
            <Link key={it.id} to={`/books/${it.bookId}`} className="mybook-card">
              <img src={it.book.cover} alt={it.book.title} className="cover" width={140} height={200} loading="lazy" />
              <div className="book-body">
                <h3>{it.book.title}</h3>
                <p className="author">{it.book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="section-title">토론 ({discussions.length})</h2>
      {discussions.length === 0 ? (
        <p className="muted">참여한 토론이 없어요.</p>
      ) : (
        <ul className="discussion-list">
          {discussions.map((d) => (
            <li key={d.id} className="discussion-item">
              <img
                src={d.book.cover}
                alt={d.book.title}
                className="record-cover"
                width={54}
                height={76}
                loading="lazy"
              />
              <div className="discussion-main">
                <Link to={`/discussions/${d.id}`} className="discussion-title">
                  {d.title}
                </Link>
                <p className="muted small">
                  {d.book.title} · 댓글 {d._count.comments}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UserProfilePage;
