import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiGet, apiPost } from '@/shared/api/client.ts';
import type { User } from '@/shared/api/types.ts';

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, name: string, password: string, avatar: string, birthYear: number | null) => Promise<void>;
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
    setUser(await apiPost<User>('/auth/login', { username, password }));
  };

  const register = async (username: string, name: string, password: string, avatar: string, birthYear: number | null) => {
    setUser(await apiPost<User>('/auth/register', { username, name, password, avatar, birthYear }));
  };

  const logout = async () => {
    await apiPost('/auth/logout');
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
