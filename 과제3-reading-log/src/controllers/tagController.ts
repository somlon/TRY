// tagController — 태그 요청 처리 (제공 — 수정하지 않음)

import type { RequestHandler } from 'express';
import * as tagStore from '../stores/tagStore.js';

// GET /tags — 태그 목록과 태그별 도서 수
export const list: RequestHandler = async (req, res) => {
  res.json(await tagStore.findAll());
};
