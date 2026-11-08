// 독서 기록 도메인 타입 정의 (제공 — 수정하지 않음)

// 읽기 상태 — 읽고 싶음 · 읽는 중 · 완독
export type ReadingStatus = 'want' | 'reading' | 'done';

export interface Book {
  id: number;
  title: string;
  author: string;
  status: ReadingStatus;
  rating: number | null;  // 1~5 정수, 완독(done) 도서만 가능
  memo: string;
  createdAt: string;      // 등록 시각 (ISO 문자열)
}

// 경로 매개변수 :id — validateId와 Controller가 함께 사용
export interface IdParams { id: string }

// ── 클라이언트가 보낸 값 ──────────────────────────────
// 형식을 보장할 수 없으므로 unknown으로 받고 Controller에서 검증함

// GET /books 의 query string
export interface ListQuery {
  status?: unknown;
  keyword?: unknown;
}

// POST /books 요청 본문
export interface CreateBookBody {
  title?: unknown;
  author?: unknown;
  status?: unknown;
  rating?: unknown;
  memo?: unknown;
}

// PATCH /books/:id 요청 본문 — 상태 · 별점 · 메모만 수정 가능
export interface UpdateBookBody {
  status?: unknown;
  rating?: unknown;
  memo?: unknown;
}

// ── 검증을 통과한 값 (Controller → Store) ─────────────

// 목록 조회 조건 — 지정한 조건만 존재
export interface ListOptions {
  status?: ReadingStatus;
  keyword?: string;
}

// 새 도서 등록 입력 — id · createdAt은 Store가 결정
export interface NewBook {
  title: string;
  author: string;
  status: ReadingStatus;
  rating: number | null;
  memo: string;
}

// 수정할 필드 — 전달된 필드만 존재
export interface BookChanges {
  status?: ReadingStatus;
  rating?: number | null;
  memo?: string;
}

// ── Store → Controller 결과 ──────────────────────────

export interface BookStats {
  want: number;
  reading: number;
  done: number;
  total: number;
}

// 값이 ReadingStatus인지 검사하는 타입 가드 (제공)
export function isReadingStatus(value: unknown): value is ReadingStatus {
  return value === 'want' || value === 'reading' || value === 'done';
}
