// Controller — 요청 해석 · 입력 검증 · 상태 코드와 응답 결정
// 데이터 접근은 store 함수에 위임한다. 모든 오류 응답은 { message } JSON으로 한다.

// 이름 / 학번

import type { RequestHandler } from 'express';
import * as store from '../store.js';
import { isReadingStatus } from '../types.js';
import type {
  BookChanges, CreateBookBody, IdParams, ListOptions, ListQuery, NewBook,
  ReadingStatus, UpdateBookBody,
} from '../types.js';

// ── 보조 함수 (모듈 내부 전용 — export하지 않음) ─────────
// 여러 요청 처리 함수에서 반복되는 검증은 보조 함수로 분리하여 이 영역에 작성한다.

// 별점 범위 (1~5 정수)
const RATING_MIN = 1;
const RATING_MAX = 5;

// 문자열이면 앞뒤 공백을 제거해 반환, 문자열이 아니거나 비어 있으면 null
function toRequiredText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text === '' ? null : text;
}

// 별점으로 쓸 수 있는 값인지 — null(별점 없음) 또는 1~5 정수
function isRatingValue(value: unknown): value is number | null {
  if (value === null) return true;
  return typeof value === 'number' && Number.isInteger(value) &&
    value >= RATING_MIN && value <= RATING_MAX;
}

// 해당 상태의 도서가 이 별점을 가질 수 있는지 — 별점은 완독 도서만
function isRatingAllowed(status: ReadingStatus, rating: number | null): boolean {
  return rating === null || status === 'done';
}

// ── 요청 처리 함수 ────────────────────────────────────

// TODO 12: GET /books
//   - status: 'want' · 'reading' · 'done' 중 하나가 아니면 400 (생략 시 조건 없음)
//   - keyword: 앞뒤 공백 제거 후 빈 문자열이면 조건 없음 (생략 시 조건 없음)
//              같은 이름이 여러 번 오면 배열로 도착하므로 문자열이 아니면 400
//   - 200 + 조건에 맞는 도서 배열
export const list: RequestHandler<{}, unknown, unknown, ListQuery> =
  async (req, res) => {
    const { status, keyword } = req.query;
    const options: ListOptions = {};

    if (status !== undefined) {
      if (!isReadingStatus(status)) {
        res.status(400).json({ message: 'status는 want · reading · done 중 하나여야 합니다' });
        return;
      }
      options.status = status;
    }

    if (keyword !== undefined) {
      // 같은 이름이 여러 번 오면 배열로 도착하므로 문자열인지 확인
      if (typeof keyword !== 'string') {
        res.status(400).json({ message: 'keyword는 하나의 문자열이어야 합니다' });
        return;
      }
      const text = keyword.trim();
      if (text !== '') options.keyword = text;
    }

    res.json(await store.findAll(options));
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
    // Content-Type 헤더가 없으면 req.body가 undefined
    const body: CreateBookBody = req.body ?? {};

    const title = toRequiredText(body.title);
    const author = toRequiredText(body.author);
    if (title === null || author === null) {
      res.status(400).json({ message: 'title과 author는 필수입니다' });
      return;
    }

    const status = body.status === undefined ? 'want' : body.status;
    if (!isReadingStatus(status)) {
      res.status(400).json({ message: 'status는 want · reading · done 중 하나여야 합니다' });
      return;
    }

    const memo = body.memo === undefined ? '' : body.memo;
    if (typeof memo !== 'string') {
      res.status(400).json({ message: 'memo는 문자열이어야 합니다' });
      return;
    }

    // 생략(undefined)과 null은 모두 별점 없음(null)
    const rating = body.rating ?? null;
    if (!isRatingValue(rating)) {
      res.status(400).json({ message: `rating은 ${RATING_MIN}~${RATING_MAX} 정수 또는 null이어야 합니다` });
      return;
    }
    if (!isRatingAllowed(status, rating)) {
      res.status(400).json({ message: '별점은 완독(done) 도서만 입력할 수 있습니다' });
      return;
    }

    if (await store.exists(title, author)) {
      res.status(409).json({ message: '이미 등록된 도서입니다' });
      return;
    }

    const input: NewBook = { title, author, status, rating, memo };
    res.status(201).json(await store.create(input));
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
    const id = Number(req.params.id);
    const body: UpdateBookBody = req.body ?? {};

    // ① 수정할 값이 하나도 없으면 400
    if (body.status === undefined && body.rating === undefined &&
        body.memo === undefined) {
      res.status(400).json({ message: 'status · rating · memo 중 하나 이상 필요합니다' });
      return;
    }

    // ② 형식 검증 — 통과한 값만 changes에 담음
    const changes: BookChanges = {};
    if (body.status !== undefined) {
      if (!isReadingStatus(body.status)) {
        res.status(400).json({ message: 'status는 want · reading · done 중 하나여야 합니다' });
        return;
      }
      changes.status = body.status;
    }
    if (body.rating !== undefined) {
      if (!isRatingValue(body.rating)) {
        res.status(400).json({ message: `rating은 ${RATING_MIN}~${RATING_MAX} 정수 또는 null이어야 합니다` });
        return;
      }
      changes.rating = body.rating;
    }
    if (body.memo !== undefined) {
      if (typeof body.memo !== 'string') {
        res.status(400).json({ message: 'memo는 문자열이어야 합니다' });
        return;
      }
      changes.memo = body.memo;
    }

    // ③ 대상 도서가 없으면 404
    const book = await store.findById(id);
    if (!book) {
      res.status(404).json({ message: '도서 없음' });
      return;
    }

    // ④ 수정 후의 상태가 완독이 아닌데 별점을 보내면 400
    // [설명] 별점 규칙 위반은 400 응답으로 이어지는 입력 검증이고 상태 코드는 Controller가 정하므로, HTTP를 모르는 Store가 아닌 Controller에서 검사한다.
    const nextStatus = changes.status ?? book.status;
    if (changes.rating !== undefined && !isRatingAllowed(nextStatus, changes.rating)) {
      res.status(400).json({ message: '별점은 완독(done) 도서만 입력할 수 있습니다' });
      return;
    }

    // ⑤ 수정 후 200 + 수정된 도서
    const updated = await store.update(id, changes);
    if (!updated) {
      res.status(404).json({ message: '도서 없음' });
      return;
    }
    res.json(updated);
  };

// TODO 15: DELETE /books/:id — 성공하면 204(본문 없음), 대상이 없으면 404
export const remove: RequestHandler<IdParams> = async (req, res) => {
  const removed = await store.remove(Number(req.params.id));
  if (!removed) {
    res.status(404).json({ message: '도서 없음' });
    return;
  }
  res.sendStatus(204);
};

// TODO 16: GET /books/stats — 200 + 상태별 도서 수 · 전체 도서 수
export const stats: RequestHandler = async (req, res) => {
  res.json(await store.countByStatus());
};
