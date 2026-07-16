import { Capacitor } from '@capacitor/core';

// 네이티브 앱(안드로이드) 여부. 앱에서는 쿠키 대신 토큰(Bearer)으로 인증한다. (다른 모듈도 공용)
export const NATIVE = Capacitor.isNativePlatform();

// 배포 시 백엔드 주소는 VITE_API_URL로 주입. 웹 로컬은 비우면 Vite 프록시(/api).
// 네이티브 앱은 프록시가 없으므로 절대 주소가 필요하다(빌드시 VITE_API_URL 없으면 배포 백엔드로 폴백).
export const API_BASE =
  import.meta.env.VITE_API_URL ?? (NATIVE ? 'https://book-review-api-xsmv.onrender.com' : '');

// --- 네이티브 앱 인증 토큰 (localStorage 보관) ---
const TOKEN_KEY = 'auth_token';
export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};
export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

// 백엔드 API 호출 래퍼. 웹은 쿠키(credentials), 앱은 Authorization 헤더로 인증.
const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'book-review', // 서버의 간이 CSRF 방어용 커스텀 헤더
    ...(options.headers as Record<string, string> | undefined)
  };
  // 네이티브 앱에서는 저장된 토큰을 Bearer로 실어 보낸다.
  if (NATIVE) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include', // 쿠키 세션(웹) 항상 전송
    cache: 'no-store',
    headers,
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? '요청에 실패했습니다.');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export const apiGet = <T>(path: string) => request<T>(path);

// SWR 전역 fetcher — useSWR의 key(경로 문자열)로 GET 요청.
export const swrFetcher = (path: string) => request(path);

export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

export const apiDelete = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
