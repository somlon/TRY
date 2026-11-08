// 이름 / 학번

import { Router } from 'express';
import * as book from '../controllers/bookController.js';
import { validateId } from '../middlewares/validateId.js';
import { requestTimer } from '../middlewares/requestTimer.js';

const router = Router();

// TODO 5: bookRouter 구성 — app.ts에서 '/books' 경로에 장착된다.
//   - requestTimer는 이 Router로 들어온 모든 요청에 적용한다.
//   - 아래 6개 endpoint를 Controller 함수와 연결한다.
//       GET    /books          → book.list
//       GET    /books/stats    → book.stats
//       GET    /books/:id      → book.getById
//       POST   /books          → book.create
//       PATCH  /books/:id      → book.update
//       DELETE /books/:id      → book.remove
//   - :id가 있는 endpoint에는 validateId를 적용한다.
//   - [설명] 주석 한 줄로 GET /books/stats를 GET /books/:id보다 먼저
//     선언해야 하는 이유를 남겨라.


export default router;
