import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth_context.tsx';
import { apiGet, apiPost } from '../api/client.ts';
import type { Notification } from '../api/types.ts';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);

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
              <button className="icon-btn" onClick={() => setNotiOpen((v) => !v)} title="알림">
                🔔
                {unread > 0 && <span className="noti-badge">{unread}</span>}
              </button>
              {notiOpen && (
                <div className="dropdown noti-dropdown">
                  <div className="dropdown-head"><span className="dropdown-name">알림</span></div>
                  {notifications.length === 0 ? (
                    <p className="muted small noti-empty">알림이 없어요.</p>
                  ) : (
                    notifications.map((noti) => (
                      <button
                        key={noti.id}
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
              <button className="avatar-btn" onClick={() => setMenuOpen((v) => !v)} title={user.name}>
                {user.avatar}
              </button>
              {menuOpen && (
                <div className="dropdown">
                  <div className="dropdown-head">
                    <span className="dropdown-avatar">{user.avatar}</span>
                    <span className="dropdown-name">{user.name}</span>
                  </div>
                  <button className="dropdown-item" onClick={() => go('/mypage?tab=reviews')}>내 서평</button>
                  <button className="dropdown-item" onClick={() => go('/mypage?tab=books')}>내 책</button>
                  <button className="dropdown-item" onClick={() => go('/mypage?tab=discussions')}>내 토론</button>
                  <button className="dropdown-item logout" onClick={handleLogout}>로그아웃</button>
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
