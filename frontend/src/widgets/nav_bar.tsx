import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import { displayName } from '@/shared/lib/display.ts';
import { apiGet, apiPost } from '@/shared/api/client.ts';
import type { Notification } from '@/shared/api/types.ts';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const notiBtnRef = useRef<HTMLButtonElement>(null);

  const loadNotifications = () => {
    if (!user) return;
    apiGet<Notification[]>('/notifications').then(setNotifications).catch(() => setNotifications([]));
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) setNotiOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Escape로 열린 드롭다운 닫고 트리거로 포커스 복귀
  useEffect(() => {
    if (!notiOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (notiOpen) { setNotiOpen(false); notiBtnRef.current?.focus(); }
      if (menuOpen) { setMenuOpen(false); menuBtnRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [notiOpen, menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const openNotification = async (noti: Notification) => {
    setNotiOpen(false);
    if (!noti.read) {
      await apiPost(`/notifications/${noti.id}/read`);
      loadNotifications();
    }
    navigate(noti.link);
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="navbar">
      <Link to="/" className="brand">📖 책갈피</Link>
      <div className="nav-user">
        {user ? (
          <>
            <div className="noti-menu" ref={notiRef}>
              <button
                ref={notiBtnRef}
                className="icon-btn"
                onClick={() => setNotiOpen((v) => !v)}
                aria-label={unread > 0 ? `알림 ${unread}개` : '알림'}
                aria-haspopup="menu"
                aria-expanded={notiOpen}
              >
                <span aria-hidden="true">🔔</span>
                {unread > 0 && <span className="noti-badge">{unread}</span>}
              </button>
              {notiOpen && (
                <div className="dropdown noti-dropdown" role="menu">
                  <div className="dropdown-head"><span className="dropdown-name">알림</span></div>
                  {notifications.length === 0 ? (
                    <p className="muted small noti-empty">알림이 없어요.</p>
                  ) : (
                    notifications.map((noti) => (
                      <button
                        key={noti.id}
                        role="menuitem"
                        className={`noti-item ${noti.read ? '' : 'unread'}`}
                        onClick={() => openNotification(noti)}
                      >
                        <span className="noti-icon">{noti.type === 'like' ? '♥' : '💬'}</span>
                        <span className="noti-text">{noti.message}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="avatar-menu" ref={menuRef}>
              <button
                ref={menuBtnRef}
                className="avatar-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={`${displayName(user)} 메뉴`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span aria-hidden="true">{user.avatar}</span>
              </button>
              {menuOpen && (
                <div className="dropdown" role="menu">
                  <div className="dropdown-head">
                    <span className="dropdown-avatar">{user.avatar}</span>
                    <span className="dropdown-name">{displayName(user)}</span>
                  </div>
                  <button role="menuitem" className="dropdown-item" onClick={() => go('/mypage')}>마이페이지</button>
                  <button role="menuitem" className="dropdown-item" onClick={() => go('/settings')}>내 정보 수정</button>
                  {user.isAdmin && <button role="menuitem" className="dropdown-item" onClick={() => go('/admin')}>관리자</button>}
                  <button role="menuitem" className="dropdown-item logout" onClick={handleLogout}>로그아웃</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="btn">로그인</Link>
        )}
      </div>
    </header>
  );
};

export default NavBar;
