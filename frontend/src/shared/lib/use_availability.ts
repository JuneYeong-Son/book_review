import { useEffect, useState } from 'react';
import { apiGet } from '@/shared/api/client.ts';

// 회원가입 실시간 중복확인 상태.
export type Availability = { checking: boolean; ok: boolean | null; message: string | null };
const IDLE: Availability = { checking: false, ok: null, message: null };

// 값이 바뀌면 디바운스(450ms) 후 서버에 사용 가능 여부를 질의한다.
// (닉네임·이메일 확인이 동일 패턴이라 훅으로 추출 — 중복 제거.)
export const useAvailability = (endpoint: string, value: string): Availability => {
  const [state, setState] = useState<Availability>(IDLE);

  useEffect(() => {
    if (!value) {
      setState(IDLE);
      return;
    }
    setState({ checking: true, ok: null, message: null });
    const timer = setTimeout(async () => {
      try {
        const r = await apiGet<{ available: boolean; message: string | null }>(
          `${endpoint}?value=${encodeURIComponent(value)}`
        );
        setState({ checking: false, ok: r.available, message: r.message });
      } catch {
        setState(IDLE);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [endpoint, value]);

  return state;
};
