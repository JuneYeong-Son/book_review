// 배포 시 백엔드 주소는 VITE_API_URL로 주입. 로컬은 비워두면 Vite 프록시(/api)를 사용.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// 백엔드 API 호출 래퍼. credentials: 'include'로 쿠키 세션을 항상 함께 전송한다.
const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',
    cache: 'no-store', // 추천 목록 등이 브라우저 캐시로 옛 데이터를 주지 않도록
    // X-Requested-With: 서버의 간이 CSRF 방어용 커스텀 헤더
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'book-review' },
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
// 여러 화면이 같은 key를 쓰면 SWR이 요청을 자동 dedup하고 캐시를 공유한다.
export const swrFetcher = (path: string) => request(path);

export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

export const apiDelete = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
