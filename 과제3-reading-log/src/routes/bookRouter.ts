// 이름 / 학번

import { Router } from 'express';
import * as book from '../controllers/bookController.js';
import * as note from '../controllers/noteController.js';
import { validateId } from '../middlewares/validateId.js';
import { requestTimer } from '../middlewares/requestTimer.js';

const router = Router();

// TODO 3: bookRouter 구성 — app.ts에서 '/books' 경로에 장착된다.
//   - requestTimer는 이 Router로 들어온 모든 요청에 적용한다.
//   - 아래 7개 endpoint를 Controller 함수와 연결한다.
//       GET    /books                      → book.list
//       GET    /books/:id                  → book.getById
//       POST   /books                      → book.create
//       PATCH  /books/:id                  → book.update
//       DELETE /books/:id                  → book.remove
//       POST   /books/:id/notes            → note.create
//       DELETE /books/:id/notes/:noteId    → note.remove
//   - 경로 매개변수(:id, :noteId)가 있는 endpoint에는 validateId를 적용한다.


export default router;
