import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth_context.tsx';

// 회원가입 시 고를 수 있는 이모지 아바타
const AVATARS = ['📚', '🦊', '🐰', '🐻', '🐱', '🦉', '🐼', '🦄', '🌱', '⭐'];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await register(username, name, password, avatar);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-card">
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit}>
        <div className="avatar-picker">
          <span className="picker-label">프로필 이미지</span>
          <div className="avatar-preview">{avatar}</div>
          <div className="avatar-options">
            {AVATARS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                className={`avatar-option ${avatar === emoji ? 'selected' : ''}`}
                onClick={() => setAvatar(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <label>
          아이디
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label>
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn full">가입하기</button>
      </form>
      <p className="muted">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </div>
  );
};

export default RegisterPage;
