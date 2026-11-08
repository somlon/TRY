// 이름 / 학번

import type { RequestHandler } from 'express';
import type { IdParams } from '../types.js';

// TODO 2: 경로의 :id 검증 미들웨어 — :id가 있는 endpoint에 장착한다.
//   - :id가 1 이상의 정수가 아니면 400 + { message } 로 응답하고 종료한다.
//     예) abc · 0 · -3 · 1.5 → 400
//   - 올바르면 다음 단계(Controller)로 진행한다.
export const validateId: RequestHandler<IdParams> = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ message: '잘못된 id' });
    return;
  }
  next();
};
