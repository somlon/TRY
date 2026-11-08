// 이름 / 학번

import type { RequestHandler } from 'express';

// TODO 3: 처리 시간 기록 미들웨어 — bookRouter 전체에 장착한다.
//   - 응답 전송이 끝난 시점에 아래 형식으로 한 줄을 출력한다.
//       [time] 메서드 전체경로 상태코드 처리시간ms
//       예) [time] GET /books?keyword=code 200 3ms
//           [time] PATCH /books/3 400 1ms
//   - 전체경로는 장착 경로(/books)와 query string을 포함한 원래 요청 URL이다.
//   - /books로 시작하지 않는 요청(예: GET /users)은 기록되지 않아야 한다.
export const requestTimer: RequestHandler = (req, res, next) => {
  throw new Error('TODO 3: requestTimer를 구현하세요');
};
