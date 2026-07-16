import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import { apiGet } from '@/shared/api/client.ts';

// 회원가입 시 고를 수 있는 이모지 아바타
const AVATARS = ['📚', '🦊', '🐰', '🐻', '🐱', '🦉', '🐼', '🦄', '🌱', '⭐'];

type Availability = { checking: boolean; ok: boolean | null; message: string | null };
const IDLE: Availability = { checking: false, ok: null, message: null };

const RegisterPage = () => {
  const { startRegister, verifyRegister } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [birthYear, setBirthYear] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 실시간 중복 확인
  const [nickCheck, setNickCheck] = useState<Availability>(IDLE);
  const [emailCheck, setEmailCheck] = useState<Availability>(IDLE);

  // 2단계
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  // 닉네임: 입력이 멈추면(디바운스) 서버에 사용 가능 여부 질의
  useEffect(() => {
    if (!nickname) { setNickCheck(IDLE); return; }
    setNickCheck({ checking: true, ok: null, message: null });
    const t = setTimeout(async () => {
      try {
        const r = await apiGet<{ available: boolean; message: string | null }>(
          `/auth/check/nickname?value=${encodeURIComponent(nickname)}`
        );
        setNickCheck({ checking: false, ok: r.available, message: r.message });
      } catch {
        setNickCheck(IDLE);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [nickname]);

  // 이메일도 동일하게 확인
  useEffect(() => {
    if (!email) { setEmailCheck(IDLE); return; }
    setEmailCheck({ checking: true, ok: null, message: null });
    const t = setTimeout(async () => {
      try {
        const r = await apiGet<{ available: boolean; message: string | null }>(
          `/auth/check/email?value=${encodeURIComponent(email)}`
        );
        setEmailCheck({ checking: false, ok: r.available, message: r.message });
      } catch {
        setEmailCheck(IDLE);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [email]);

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (nickCheck.ok === false) { setError(nickCheck.message ?? '닉네임을 확인해주세요.'); return; }
    if (emailCheck.ok === false) { setError(emailCheck.message ?? '이메일을 확인해주세요.'); return; }
    setSubmitting(true);
    try {
      const r = await startRegister({
        username, email, name, nickname, phone, password, avatar,
        birthYear: birthYear ? Number(birthYear) : null,
        agreed
      });
      setDevCode(r.dev ? r.devCode ?? null : null);
      setStep('verify');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await verifyRegister(email, code.trim());
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="auth-card">
        <h1>이메일 인증</h1>
        <p className="muted"><strong>{email}</strong>로 보낸 6자리 인증 코드를 입력해주세요.</p>
        {devCode && (
          <p className="muted small">테스트 모드(메일 미설정): 인증 코드는 <strong>{devCode}</strong> 입니다.</p>
        )}
        <form onSubmit={submitCode}>
          <label>
            인증 코드
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="6자리 숫자" required />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="btn full" disabled={submitting}>{submitting ? '확인 중…' : '가입 완료'}</button>
        </form>
        <p className="muted"><button type="button" className="link-btn" onClick={() => { setStep('form'); setError(''); }}>← 정보 다시 입력</button></p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>회원가입</h1>
      <form onSubmit={submitForm}>
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
          아이디 <em className="optional">(로그인용)</em>
          <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
        </label>
        <label>
          이메일
          <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" required aria-describedby="email-check" />
          <small id="email-check" className={`field-hint ${emailCheck.ok === false ? 'bad' : emailCheck.ok ? 'ok' : ''}`}>
            {emailCheck.checking ? '확인 중…' : emailCheck.ok ? '사용 가능한 이메일이에요.' : emailCheck.message ?? '인증 코드를 이 주소로 보냅니다.'}
          </small>
        </label>
        <label>
          닉네임 <em className="optional">(활동 표시명)</em>
          <input name="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="off" required aria-describedby="nick-check" />
          <small id="nick-check" className={`field-hint ${nickCheck.ok === false ? 'bad' : nickCheck.ok ? 'ok' : ''}`}>
            {nickCheck.checking ? '확인 중…' : nickCheck.ok ? '사용 가능한 닉네임이에요.' : nickCheck.message ?? '한글/영문/숫자/밑줄 2~16자'}
          </small>
        </label>
        <label>
          이름 <em className="optional">(실명 등, 비공개)</em>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <label>
          휴대폰 번호
          <input name="tel" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="numeric" placeholder="010-1234-5678" required />
        </label>
        <label>
          비밀번호
          <input name="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} aria-describedby="pw-hint" />
          <small id="pw-hint" className="muted">8자 이상, 영문과 숫자를 모두 포함해주세요.</small>
        </label>
        <label className="consent-row">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
          <span><Link to="/terms" target="_blank">개인정보 수집·이용</Link>에 동의합니다. (필수)</span>
        </label>
        <label>
          출생연도 <em className="optional">(선택 · 연령대 추천에 사용)</em>
          <input name="birthYear" type="number" inputMode="numeric" min={1900} max={2025} value={birthYear} onChange={(e) => setBirthYear(e.target.value)} autoComplete="bday-year" placeholder="예: 2000" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn full" disabled={submitting || nickCheck.checking || emailCheck.checking}>
          {submitting ? '전송 중…' : '인증 메일 받기'}
        </button>
      </form>
      <p className="muted">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </div>
  );
};

export default RegisterPage;
