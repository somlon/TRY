// 이름 / 학번

import type { RequestHandler, ErrorRequestHandler } from 'express';

// 404 — 어떤 Router도 응답하지 않은 요청 (제공 — 수정하지 않음)
export const notFound: RequestHandler = (req, res) => {
  const msg = `Cannot ${req.method} ${req.path}`;
  res.status(404).json({ message: msg });
};

// TODO 4: 에러 핸들러
//   - 응답이 이미 전송되기 시작했으면 Express 기본 처리기에 넘긴다.
//   - 서버 콘솔에 오류를 기록한다.
//   - 잘못된 JSON 본문으로 발생한 오류는 400, 그 밖의 오류는 500으로 응답한다.
//   - 응답 형식은 다른 오류 응답과 같은 { message } JSON으로 통일한다.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'TODO 4: errorHandler를 구현하세요' });
};
