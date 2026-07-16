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
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await register(username, name, password, avatar, birthYear ? Number(birthYear) : null);
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
          <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
        <label>
          이름
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label>
          비밀번호
          <input name="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </label>
        <label>
          출생연도 <em className="optional">(선택 · 연령대 추천에 사용)</em>
          <input name="birthYear" type="number" inputMode="numeric" min={1900} max={2025} value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="예: 2000" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn full">가입하기</button>
      </form>
      <p className="muted">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </div>
  );
};

export default RegisterPage;
