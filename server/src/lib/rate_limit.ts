import rateLimit from 'express-rate-limit';

// 공통 레이트리밋 팩토리 — 표준 헤더·안내 메시지는 고정, windowMs·max만 지정.
export const makeRateLimiter = (windowMs: number, max: number) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' }
  });
