// tagRouter — app.ts에서 '/tags' 경로에 장착 (제공 — 수정하지 않음)

import { Router } from 'express';
import * as tag from '../controllers/tagController.js';
import { requestTimer } from '../middlewares/requestTimer.js';

const router = Router();

router.use(requestTimer);
router.get('/', tag.list);

export default router;
