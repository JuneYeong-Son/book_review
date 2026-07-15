import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth_context.tsx';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">📖 책갈피</Link>
      <nav className="nav-links">
        <NavLink to="/">홈</NavLink>
        <NavLink to="/records">독서 기록</NavLink>
        <NavLink to="/discussions">토론</NavLink>
      </nav>
      <div className="nav-user">
        {user ? (
          <>
            <span className="hello">{user.name}님</span>
            <button className="btn ghost" onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <Link to="/login" className="btn">로그인</Link>
        )}
      </div>
    </header>
  );
};

export default NavBar;
