// 애플리케이션 진입점 — 공통 미들웨어 등록 · Router 장착 · 404 · 에러 처리
// 이 파일에는 요청 처리 코드를 작성하지 않는다.

// 이름 / 학번

import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bookRouter from './routes/bookRouter.js';
import { notFound, errorHandler } from './middlewares/errorHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// TODO 1: 아래 6가지를 올바른 순서로 app에 등록하라.
//   - morgan('dev') 요청 로그
//   - public 폴더의 정적 파일 제공 (src의 상위 폴더에 있는 public)
//   - JSON 본문 파싱
//   - bookRouter를 '/books' 경로에 장착
//   - notFound (404)
//   - errorHandler (에러 처리)
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());
app.use('/books', bookRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}에서 대기 중`);
});
