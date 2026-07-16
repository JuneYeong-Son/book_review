import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { apiGet, apiDelete } from '@/shared/api/client.ts';
import type { AdminStats, ReportedPost, Progress } from '@/shared/api/types.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';

const AdminPage = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<ReportedPost[]>([]);
  const [reviews, setReviews] = useState<Progress[]>([]);

  const load = () => {
    apiGet<AdminStats>('/admin/stats').then(setStats).catch(() => setStats(null));
    apiGet<ReportedPost[]>('/admin/reports').then(setReports).catch(() => setReports([]));
    apiGet<Progress[]>('/admin/reviews').then(setReviews).catch(() => setReviews([]));
  };

  useEffect(() => { if (user?.isAdmin) load(); }, [user]);

  if (loading) return <p className="muted">불러오는 중…</p>;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;

  const removePost = async (p: ReportedPost) => {
    if (!window.confirm(`'${p.title}'을(를) 삭제할까요?`)) return;
    await apiDelete(`/admin/posts/${p.targetType}/${p.targetId}`);
    load();
  };

  const removeReview = async (r: Progress) => {
    if (!window.confirm(`'${r.book.title}' 서평(${r.user.name})을 삭제할까요? 되돌릴 수 없어요.`)) return;
    await apiDelete(`/admin/posts/review/${r.id}`);
    load();
  };

  return (
    <section>
      <div className="page-head">
        <h1>관리자 대시보드</h1>
        <p className="muted">{user.name}님 (관리자)</p>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-num">{stats?.todayVisitors ?? '-'}</span>
          <span className="stat-label">오늘의 접속자</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats?.members ?? '-'}</span>
          <span className="stat-label">전체 회원 수</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats?.reportedPosts ?? '-'}</span>
          <span className="stat-label">신고된 게시물</span>
        </div>
      </div>

      <h2 className="section-title">신고된 게시물 (신고 많은 순)</h2>
      {reports.length === 0 ? (
        <p className="muted">신고된 게시물이 없어요.</p>
      ) : (
        <ul className="report-list">
          {reports.map((p) => (
            <li key={`${p.targetType}-${p.targetId}`} className="report-item">
              <span className="report-count">🚩 {p.count}</span>
              <div className="report-main">
                {p.link === '#' ? (
                  <span className="report-title">{p.title}</span>
                ) : (
                  <Link to={p.link} className="report-title">{p.title}</Link>
                )}
                <p className="muted small">
                  {p.targetType === 'review' ? '서평' : p.targetType === 'discussion' ? '토론' : '사용자'} · {p.author}
                  {p.snippet && ` · ${p.snippet.slice(0, 40)}`}
                </p>
              </div>
              <button className="btn danger small" onClick={() => removePost(p)}>
                {p.targetType === 'user' ? '회원 삭제' : '삭제'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">전체 서평 관리 ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <p className="muted">서평이 없어요.</p>
      ) : (
        <ul className="record-list">
          {reviews.map((r) => (
            <li key={r.id} className="record-item">
              <img src={r.book.cover} alt={r.book.title} className="record-cover" width={54} height={76} loading="lazy" />
              <div className="record-main">
                <Link to={`/books/${r.bookId}/reviews/${r.bookSeq}`}><strong>{r.book.title}</strong></Link>
                <p className="muted small">
                  {r.user.avatar} {r.user.name} · {r.startPage}~{r.endPage}쪽 · ♥ {r.likes.length}
                </p>
                {r.note && <p className="record-note">{r.note.length > 120 ? `${r.note.slice(0, 120)}…` : r.note}</p>}
              </div>
              <button className="btn danger small" onClick={() => removeReview(r)}>삭제</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AdminPage;
