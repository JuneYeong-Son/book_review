import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { mutate } from 'swr';
import { apiGet, apiPost } from '@/shared/api/client.ts';
import type { User } from '@/shared/api/types.ts';

// 로그인/가입/로그아웃 등 "누가 로그인했는지"가 바뀌면 SWR 캐시를 통째로 비운다.
// (서재·서평 등 사용자별 캐시 키가 고정 문자열이라, 안 비우면 이전 사용자의 데이터가
//  다음 사용자에게 잠깐 그대로 보인다 — 신규 가입자 서재에 남의 책이 보이던 문제.)
const clearSwrCache = () => mutate(() => true, undefined, { revalidate: false });

export type RegisterInput = {
  username: string;
  email: string;
  name: string;
  nickname: string;
  phone: string;
  password: string;
  avatar: string;
  birthYear: number | null;
  agreed: boolean;
};

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  // 이메일 인증 2단계 회원가입
  startRegister: (data: RegisterInput) => Promise<{ dev: boolean; devCode?: string }>;
  verifyRegister: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearUser: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 첫 로드 시 현재 로그인 상태 확인
  useEffect(() => {
    apiGet<User>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const next = await apiPost<User>('/auth/login', { username, password });
    await clearSwrCache();
    setUser(next);
  };

  // 1단계: 정보 제출 → 인증 메일 발송 (아직 로그인 아님)
  const startRegister = (data: RegisterInput) =>
    apiPost<{ dev: boolean; devCode?: string }>('/auth/register/start', data);

  // 2단계: 인증 코드 확인 → 가입 확정 + 로그인
  const verifyRegister = async (email: string, code: string) => {
    const next = await apiPost<User>('/auth/register/verify', { email, code });
    await clearSwrCache();
    setUser(next);
  };

  const logout = async () => {
    await apiPost('/auth/logout');
    await clearSwrCache();
    setUser(null);
  };

  // 프로필 변경 후 최신 사용자 정보 재조회
  const refresh = async () => {
    try {
      setUser(await apiGet<User>('/auth/me'));
    } catch {
      setUser(null);
    }
  };

  const clearUser = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, startRegister, verifyRegister, logout, refresh, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
