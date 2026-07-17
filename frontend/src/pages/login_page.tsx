import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/shared/lib/auth_context.tsx';
// 소셜 로그인 진입점은 백엔드 절대 주소(API_BASE)로, 앱(NATIVE)에선 리다이렉트 방식이라 버튼 숨김.
import { NATIVE, API_BASE } from '@/shared/api/client.ts';
const OAUTH_ERRORS: Record<string, string> = {
  oauth: '소셜 로그인에 실패했어요. 다시 시도해주세요.',
  oauth_unconfigured: '소셜 로그인이 아직 설정되지 않았어요.',
  unconfigured: '소셜 로그인 키가 서버에 설정되지 않았어요. (관리자: 환경변수 확인)',
  token: '소셜 인증(토큰 교환)에 실패했어요. 리다이렉트 URI/키 설정을 확인해주세요.',
  profile: '소셜 프로필 조회에 실패했어요. 동의 항목을 확인해주세요.',
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
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </label>
        <label>
          비밀번호
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn full" disabled={submitting}>
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>

      {!NATIVE && (
        <>
          <div className="oauth-divider">
            <span>또는</span>
          </div>
          <a className="btn full kakao-btn" href={`${API_BASE}/api/auth/oauth/kakao`}>
            <span aria-hidden="true">💬</span> 카카오로 로그인
          </a>
          <a className="btn full google-btn" href={`${API_BASE}/api/auth/oauth/google`}>
            <span aria-hidden="true">🔵</span> 구글로 로그인
          </a>
        </>
      )}

      <p className="muted">
        계정이 없나요? <Link to="/register">회원가입</Link>
      </p>
    </div>
  );
};

export default LoginPage;
