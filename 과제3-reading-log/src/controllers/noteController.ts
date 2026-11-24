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
    const bookId = Number(req.params.id);
    // Content-Type 헤더가 없으면 req.body가 undefined
    const body: CreateNoteBody = req.body ?? {};

    const page = body.page;
    if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
      res.status(400).json({ message: 'page는 1 이상의 정수여야 합니다' });
      return;
    }

    if (typeof body.content !== 'string' || body.content.trim() === '') {
      res.status(400).json({ message: 'content는 필수입니다' });
      return;
    }
    const content = body.content.trim();

    // 도서가 없으면 noteStore.create가 null 반환
    const note = await noteStore.create(bookId, { page, content });
    if (!note) {
      res.status(404).json({ message: '도서 없음' });
      return;
    }
    res.status(201).json(note);
  };

// TODO 16: DELETE /books/:id/notes/:noteId
//   - 성공하면 204(본문 없음)
//   - 노트가 없거나 경로의 도서(:id)에 속한 노트가 아니면 404
export const remove: RequestHandler<NoteParams> = async (req, res) => {
  const bookId = Number(req.params.id);
  const noteId = Number(req.params.noteId);
  if (!(await noteStore.remove(bookId, noteId))) {
    res.status(404).json({ message: '노트 없음' });
    return;
  }
  res.sendStatus(204);
};
