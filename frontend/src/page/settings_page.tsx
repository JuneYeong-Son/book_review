import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiPatch, apiPost, apiDelete } from '../api/client.ts';
import { useAuth } from '../lib/auth_context.tsx';

const AVATARS = ['📚', '🦊', '🐰', '🐻', '🐱', '🦉', '🐼', '🦄', '🌱', '⭐'];

const SettingsPage = () => {
  const { user, refresh, clearUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '📚');
  const [birthYear, setBirthYear] = useState(user?.birthYear ? String(user.birthYear) : '');
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  const [delPassword, setDelPassword] = useState('');
  const [delErr, setDelErr] = useState('');

  if (!user) return <Navigate to="/login" replace />;

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    await apiPatch('/auth/me', { name, avatar, birthYear: birthYear ? Number(birthYear) : null });
    await refresh();
    setProfileMsg('저장되었습니다.');
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    try {
      await apiPost('/auth/change-password', { currentPassword, newPassword });
      setPwMsg('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwErr((err as Error).message);
    }
  };

  const removeAccount = async (e: FormEvent) => {
    e.preventDefault();
    setDelErr('');
    if (!window.confirm('정말 탈퇴하시겠어요? 모든 기록이 삭제되며 되돌릴 수 없어요.')) return;
    try {
      await apiDelete('/auth/me', { password: delPassword });
      clearUser();
      navigate('/');
    } catch (err) {
      setDelErr((err as Error).message);
    }
  };

  return (
    <section className="settings">
      <div className="page-head">
        <h1>내 정보 수정</h1>
      </div>

      <form className="settings-card" onSubmit={saveProfile}>
        <h2>프로필</h2>
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
        <label>
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          출생연도 <em className="optional">(연령대 추천에 사용)</em>
          <input type="number" min={1900} max={2025} value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="예: 2000" />
        </label>
        {profileMsg && <p className="success">{profileMsg}</p>}
        <button type="submit" className="btn">저장</button>
      </form>

      <form className="settings-card" onSubmit={savePassword}>
        <h2>비밀번호 변경</h2>
        <label>
          현재 비밀번호
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        </label>
        <label>
          새 비밀번호
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        </label>
        {pwErr && <p className="error">{pwErr}</p>}
        {pwMsg && <p className="success">{pwMsg}</p>}
        <button type="submit" className="btn">비밀번호 변경</button>
      </form>

      <form className="settings-card danger-card" onSubmit={removeAccount}>
        <h2>회원 탈퇴</h2>
        <p className="muted small">탈퇴하면 작성한 서평·토론·댓글 등 모든 데이터가 삭제되며 복구할 수 없어요.</p>
        <label>
          비밀번호 확인
          <input type="password" value={delPassword} onChange={(e) => setDelPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {delErr && <p className="error">{delErr}</p>}
        <button type="submit" className="btn danger">회원 탈퇴</button>
      </form>
    </section>
  );
};

export default SettingsPage;
