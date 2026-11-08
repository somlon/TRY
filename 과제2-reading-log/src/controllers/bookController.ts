// Controller — 요청 해석 · 입력 검증 · 상태 코드와 응답 결정
// 데이터 접근은 store 함수에 위임한다. 모든 오류 응답은 { message } JSON으로 한다.

// 이름 / 학번

import type { RequestHandler } from 'express';
import * as store from '../store.js';
import { isReadingStatus } from '../types.js';
import type {
  BookChanges, CreateBookBody, IdParams, ListOptions, ListQuery, NewBook,
  UpdateBookBody,
} from '../types.js';

// ── 보조 함수 (모듈 내부 전용 — export하지 않음) ─────────
// 여러 요청 처리 함수에서 반복되는 검증은 보조 함수로 분리하여 이 영역에 작성한다.


// ── 요청 처리 함수 ────────────────────────────────────

// TODO 12: GET /books
//   - status: 'want' · 'reading' · 'done' 중 하나가 아니면 400 (생략 시 조건 없음)
//   - keyword: 앞뒤 공백 제거 후 빈 문자열이면 조건 없음 (생략 시 조건 없음)
//              같은 이름이 여러 번 오면 배열로 도착하므로 문자열이 아니면 400
//   - 200 + 조건에 맞는 도서 배열
export const list: RequestHandler<{}, unknown, unknown, ListQuery> =
  async (req, res) => {
    throw new Error('TODO 12: list를 구현하세요');
  };

// [제공 예시] GET /books/:id (수정 불필요)
// id 형식은 validateId가 이미 검사했으므로 여기서는 존재 여부만 판단한다.
// store의 비동기 함수를 await로 호출하는 Controller의 형태를 참고하라.
export const getById: RequestHandler<IdParams> = async (req, res) => {
  const book = await store.findById(Number(req.params.id));
  if (!book) {
    res.status(404).json({ message: '도서 없음' });
    return;
  }
  res.json(book);
};

// TODO 13: POST /books
//   - title · author: 필수, 문자열, 앞뒤 공백 제거 후 빈 문자열이면 400
//                     (저장도 공백을 제거한 값으로 함)
//   - status: 생략 시 'want', 허용 값이 아니면 400
//   - memo  : 생략 시 '', 문자열이 아니면 400
//   - rating: 생략 또는 null이면 null, 1~5 정수가 아니면 400,
//             status가 'done'이 아닌데 별점이 있으면 400
//   - 같은 제목 + 저자의 도서가 이미 있으면 409
//   - 성공하면 201 + 저장된 도서
export const create:
  RequestHandler<{}, unknown, CreateBookBody | undefined> =
  async (req, res) => {
    throw new Error('TODO 13: create를 구현하세요');
  };

// TODO 14: PATCH /books/:id — status · rating · memo만 수정할 수 있음
//   ① status · rating · memo가 하나도 없으면 400
//   ② 형식 검증 — 위반하면 400
//        status: 허용 값 / rating: 1~5 정수 또는 null / memo: 문자열
//   ③ 대상 도서가 없으면 404
//   ④ 수정 후의 상태가 'done'이 아닌데 rating(null 제외)을 보내면 400
//      [설명] 주석 한 줄로 이 별점 규칙을 Store가 아닌 Controller에서
//      검사하는 이유를 남겨라.
//   ⑤ 성공하면 200 + 수정된 도서
export const update:
  RequestHandler<IdParams, unknown, UpdateBookBody | undefined> =
  async (req, res) => {
    throw new Error('TODO 14: update를 구현하세요');
  };

// TODO 15: DELETE /books/:id — 성공하면 204(본문 없음), 대상이 없으면 404
export const remove: RequestHandler<IdParams> = async (req, res) => {
  throw new Error('TODO 15: remove를 구현하세요');
};

// TODO 16: GET /books/stats — 200 + 상태별 도서 수 · 전체 도서 수
export const stats: RequestHandler = async (req, res) => {
  throw new Error('TODO 16: stats를 구현하세요');
};
