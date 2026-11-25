// 처리 시간 기록 미들웨어 (제공 — 수정하지 않음)
import type { RequestHandler } from 'express';

// 응답 전송이 끝나면 [time] 메서드 전체경로 상태코드 처리시간ms 를 출력
export const requestTimer: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - startedAt;
    console.log(
      `[time] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`,
    );
  });
  next();
};
