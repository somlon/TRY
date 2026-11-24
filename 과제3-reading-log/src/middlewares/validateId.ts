// 경로 매개변수 검증 미들웨어 (제공 — 수정하지 않음)
import type { NextFunction, Request, Response } from 'express';
import type { IdParams } from '../types.js';

// 경로의 모든 매개변수(:id, :noteId)가 1 이상의 정수가 아니면 400
// 올바르면 다음 단계(Controller)로 진행
// <P extends IdParams> — /:id, /:id/notes/:noteId 경로에 모두 장착 가능하도록 지정
export function validateId<P extends IdParams>(
  req: Request<P>, res: Response, next: NextFunction,
): void {
  for (const value of Object.values(req.params)) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ message: '잘못된 id' });
      return;
    }
  }
  next();
}
