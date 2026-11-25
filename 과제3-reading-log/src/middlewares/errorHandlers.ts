// 이름 / 학번

import type { RequestHandler, ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';

// 404 — 어떤 Router도 응답하지 않은 요청 (제공 — 수정하지 않음)
export const notFound: RequestHandler = (req, res) => {
  const msg = `Cannot ${req.method} ${req.path}`;
  res.status(404).json({ message: msg });
};

// TODO 2: 에러 핸들러
//   - 응답이 이미 전송되기 시작했으면 Express 기본 처리기에 넘긴다.
//   - 서버 콘솔에 오류를 기록한다.
//   - 잘못된 JSON 본문으로 발생한 오류는 400으로 응답한다.
//   - Prisma가 원인을 알고 있는 오류(PrismaClientKnownRequestError)는
//       code가 'P2002'(고유 제약 위반)이면 409, 그 밖의 코드는 500으로 응답한다.
//       응답에는 { message, code }만 전달한다. (오류 메시지 원문은 응답하지 않음)
//   - 그 밖의 오류는 500으로 응답한다.
//   - 응답 형식은 다른 오류 응답과 같은 { message } JSON으로 통일한다.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // 응답을 이미 보내기 시작했으면 더 쓸 수 없으므로 Express 기본 처리기에 넘김
  if (res.headersSent) {
    next(err);
    return;
  }

  console.error(err);

  // express.json()이 본문을 해석하지 못하면 SyntaxError가 전달됨 → 클라이언트 잘못(400)
  if (err instanceof SyntaxError) {
    res.status(400).json({ message: '잘못된 JSON 본문' });
    return;
  }

  // Prisma 오류 — 응답에는 오류 코드만 전달 (메시지 원문에는 테이블 · 질의 등 내부 정보가 있음)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 — 고유 제약 위반(같은 제목 + 저자 등) → 409
    if (err.code === 'P2002') {
      res.status(409).json({ message: '이미 등록된 데이터', code: err.code });
      return;
    }
    res.status(500).json({ message: '데이터베이스 요청 오류', code: err.code });
    return;
  }

  const message = err instanceof Error ? err.message : '알 수 없는 오류';
  res.status(500).json({ message });
};
