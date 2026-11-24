// noteController — 독서 노트 요청 처리
// 경로의 :id, :noteId 형식은 validateId가 이미 검사한다.

// 이름 / 학번

import type { RequestHandler } from 'express';
import * as noteStore from '../stores/noteStore.js';
import type { CreateNoteBody, IdParams, NoteParams } from '../types.js';

// TODO 15: POST /books/:id/notes — 경로의 :id 도서에 노트 등록
//   - page   : 1 이상의 정수가 아니면 400
//   - content: 문자열, 앞뒤 공백 제거 후 빈 문자열이면 400 (저장도 공백을 제거한 값으로 함)
//   - 도서가 없으면(noteStore.create가 null 반환) 404
//   - 성공하면 201 + 저장된 노트
export const create:
  RequestHandler<IdParams, unknown, CreateNoteBody | undefined> =
  async (req, res) => {
    throw new Error('TODO 15: create를 구현하세요');
  };

// TODO 16: DELETE /books/:id/notes/:noteId
//   - 성공하면 204(본문 없음)
//   - 노트가 없거나 경로의 도서(:id)에 속한 노트가 아니면 404
export const remove: RequestHandler<NoteParams> = async (req, res) => {
  throw new Error('TODO 16: remove를 구현하세요');
};
