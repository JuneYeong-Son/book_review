import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { mutate } from 'swr';
import { apiGet, apiPost, apiDelete, apiPatch } from '@/shared/api/client.ts';
import type { AdminStats, ReportedPost, Progress, Member, Feedback, Notice } from '@/shared/api/types.ts';
import { KEY } from '@/shared/api/hooks.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';

const AdminPage = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<ReportedPost[]>([]);
  const [reviews, setReviews] = useState<Progress[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  // 공지 작성 폼
  const [nTitle, setNTitle] = useState('');
  const [nBody, setNBody] = useState('');
  const [nPinned, setNPinned] = useState(false);

  const load = () => {
    apiGet<AdminStats>('/admin/stats')
      .then(setStats)
      .catch(() => setStats(null));
    apiGet<ReportedPost[]>('/admin/reports')
      .then(setReports)
      .catch(() => setReports([]));
    apiGet<Progress[]>('/admin/reviews')
      .then(setReviews)
      .catch(() => setReviews([]));
    apiGet<Member[]>('/admin/members')
      .then(setMembers)
      .catch(() => setMembers([]));
    apiGet<Feedback[]>('/admin/feedback')
      .then(setFeedback)
      .catch(() => setFeedback([]));
    apiGet<Notice[]>('/notices')
      .then(setNotices)
      .catch(() => setNotices([]));
  };

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user]);

  if (loading) return <p className="muted">불러오는 중…</p>;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;

  // 실패 메시지를 alert로 보여주는 공통 처리
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      load();
    } catch (err) {
      window.alert((err as Error).message);
    }
  };
  const toggleAdmin = (m: Member) => run(() => apiPatch(`/admin/members/${m.id}/admin`, { isAdmin: !m.isAdmin }));
  const toggleSuspend = (m: Member) =>
    run(() => apiPatch(`/admin/members/${m.id}/suspend`, { suspended: !m.suspended }));
  const deleteMember = (m: Member) => {
    if (!window.confirm(`'${m.name}(@${m.username})' 회원을 삭제할까요? 관련 데이터가 모두 지워지며 되돌릴 수 없어요.`))
      return;
    run(() => apiDelete(`/admin/members/${m.id}`));
  };
  const toggleResolved = (f: Feedback) =>
    run(() => apiPatch(`/admin/feedback/${f.id}/resolve`, { resolved: !f.resolved }));
  const deleteFeedback = (f: Feedback) => run(() => apiDelete(`/admin/feedback/${f.id}`));

  // 공지사항 관리 — 변경 후 공용 SWR 캐시(홈 배너·목록)도 갱신
  const createNotice = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await apiPost('/notices', { title: nTitle, body: nBody, pinned: nPinned });
      setNTitle('');
      setNBody('');
      setNPinned(false);
      mutate(KEY.notices);
    });
  };
  const togglePin = (n: Notice) =>
    run(async () => {
      await apiPatch(`/notices/${n.id}`, { pinned: !n.pinned });
      mutate(KEY.notices);
    });
  const deleteNotice = (n: Notice) => {
    if (!window.confirm(`공지 '${n.title}'을(를) 삭제할까요?`)) return;
    run(async () => {
      await apiDelete(`/notices/${n.id}`);
      mutate(KEY.notices);
    });
  };

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

      <h2 className="section-title">공지사항 관리 ({notices.length})</h2>
      <form className="notice-form" onSubmit={createNotice}>
        <input
          value={nTitle}
          onChange={(e) => setNTitle(e.target.value)}
          placeholder="공지 제목"
          required
          minLength={2}
        />
        <textarea
          value={nBody}
          onChange={(e) => setNBody(e.target.value)}
          rows={3}
          placeholder="공지 내용"
          required
          minLength={5}
        />
        <label className="consent-row">
          <input type="checkbox" checked={nPinned} onChange={(e) => setNPinned(e.target.checked)} /> 상단 고정
        </label>
        <button className="btn small" type="submit">
          공지 등록
        </button>
      </form>
      {notices.length > 0 && (
        <ul className="notice-admin-list">
          {notices.map((n) => (
            <li key={n.id} className="notice-admin-item">
              <div className="notice-admin-main">
                <p className="notice-admin-title">
                  {n.pinned && '📌 '}
                  {n.title}
                </p>
                <p className="muted small">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</p>
              </div>
              <div className="notice-admin-actions">
                <button className="btn ghost small" onClick={() => togglePin(n)}>
                  {n.pinned ? '고정 해제' : '고정'}
                </button>
                <button className="btn danger small" onClick={() => deleteNotice(n)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

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
                  <Link to={p.link} className="report-title">
                    {p.title}
                  </Link>
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

      <h2 className="section-title">피드백 · 버그 신고 ({feedback.length})</h2>
      {feedback.length === 0 ? (
        <p className="muted">접수된 피드백이 없어요.</p>
      ) : (
        <ul className="feedback-list">
          {feedback.map((f) => (
            <li key={f.id} className={`feedback-item ${f.resolved ? 'resolved' : ''}`}>
              <div className="feedback-main">
                <p className="feedback-msg">
                  <span className={`feedback-kind-badge ${f.kind}`}>{f.kind === 'bug' ? '🐞 버그' : '💬 의견'}</span>
                  {f.message}
                </p>
                <p className="muted small">
                  {f.name} · {new Date(f.createdAt).toLocaleString('ko-KR')}
                  {f.page && ` · ${f.page}`}
                  {f.resolved && ' · ✅ 처리됨'}
                </p>
              </div>
              <div className="feedback-actions">
                <button className="btn ghost small" onClick={() => toggleResolved(f)}>
                  {f.resolved ? '미처리로' : '처리 완료'}
                </button>
                <button className="btn danger small" onClick={() => deleteFeedback(f)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">회원 관리 ({members.length})</h2>
      {members.length === 0 ? (
        <p className="muted">회원이 없어요.</p>
      ) : (
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id} className={`member-item ${m.suspended ? 'suspended' : ''}`}>
              <span className="member-avatar" aria-hidden="true">
                {m.avatar}
              </span>
              <div className="member-main">
                <p className="member-name">
                  <Link to={`/users/${m.id}`} className="user-link">
                    {m.name}
                  </Link>
                  <span className="muted small"> @{m.username}</span>
                  {m.isAdmin && <span className="member-badge admin">관리자</span>}
                  {m.suspended && <span className="member-badge suspended">정지됨</span>}
                </p>
                <p className="muted small">가입 {new Date(m.createdAt).toLocaleDateString('ko-KR')}</p>
              </div>
              {m.id === user.id ? (
                <span className="muted small">나</span>
              ) : (
                <div className="member-actions">
                  <button className="btn ghost small" onClick={() => toggleAdmin(m)}>
                    {m.isAdmin ? '관리자 해제' : '관리자 지정'}
                  </button>
                  <button className="btn ghost small" onClick={() => toggleSuspend(m)} disabled={m.isAdmin}>
                    {m.suspended ? '정지 해제' : '활동 정지'}
                  </button>
                  <button className="btn danger small" onClick={() => deleteMember(m)} disabled={m.isAdmin}>
                    삭제
                  </button>
                </div>
              )}
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
                <p className="muted small">
                  {r.user.avatar} {r.user.name} · {r.startPage}~{r.endPage}쪽 · ♥ {r.likes.length}
                </p>
                {r.note && <p className="record-note">{r.note.length > 120 ? `${r.note.slice(0, 120)}…` : r.note}</p>}
              </div>
              <button className="btn danger small" onClick={() => removeReview(r)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AdminPage;
