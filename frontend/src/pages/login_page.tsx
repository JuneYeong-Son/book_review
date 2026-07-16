import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/shared/lib/auth_context.tsx';

// 백엔드 소셜 로그인 진입점(전체 페이지 이동). 로컬은 Vite 프록시(/api) 사용.
const API_BASE = import.meta.env.VITE_API_URL ?? '';
const OAUTH_ERRORS: Record<string, string> = {
  oauth: '소셜 로그인에 실패했어요. 다시 시도해주세요.',
  oauth_unconfigured: '소셜 로그인이 아직 설정되지 않았어요.',
  suspended: '활동이 정지된 계정입니다. 관리자에게 문의하세요.'
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(OAUTH_ERRORS[params.get('error') ?? ''] ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <label>
          아이디
          <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
        </label>
        <label>
          비밀번호
          <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn full" disabled={submitting}>{submitting ? '로그인 중…' : '로그인'}</button>
      </form>

      <div className="oauth-divider"><span>또는</span></div>
      <a className="btn full kakao-btn" href={`${API_BASE}/api/auth/oauth/kakao`}>
        <span aria-hidden="true">💬</span> 카카오로 로그인
      </a>

      <p className="muted">계정이 없나요? <Link to="/register">회원가입</Link></p>
    </div>
  );
};

export default LoginPage;
