// 애플리케이션 진입점 (제공 — 수정하지 않음)
// 공통 미들웨어 등록, Router 장착, 404, 에러 처리

import express from 'express';
import { config } from './config.js';
import bookRouter from './routes/bookRouter.js';
import tagRouter from './routes/tagRouter.js';
import { notFound, errorHandler } from './middlewares/errorHandlers.js';

const app = express();

app.use(express.json());           // JSON 본문
app.use('/books', bookRouter);     // Router 장착
app.use('/tags', tagRouter);
app.use(notFound);                 // 404
app.use(errorHandler);             // 에러 처리

app.listen(config.PORT, () => {
  console.log(`http://localhost:${config.PORT}에서 대기 중`);
});
