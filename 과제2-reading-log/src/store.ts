// Store — 도서 데이터의 조회 · 저장 · 삭제 담당
// HTTP를 알지 못한다: 상태 코드를 정하지 않고 데이터 · undefined · boolean만 반환한다.
// 모든 함수는 data/books.json 파일을 읽고, 변경했으면 파일에 다시 저장한다.

// 이름 / 학번

import { readJson, writeJson } from './jsonFile.js';
import type {
  Book, BookChanges, BookStats, ListOptions, NewBook,
} from './types.js';

const DATA_FILE = process.env.DATA_FILE ?? 'data/books.json';

// 모듈 내부 전용 — 파일 전체 읽기 · 쓰기 (제공)
async function readBooks(): Promise<Book[]> {
  return readJson<Book[]>(DATA_FILE);
}
async function writeBooks(books: Book[]): Promise<void> {
  await writeJson(DATA_FILE, books);
}

// TODO 6: 조건에 맞는 도서 배열을 반환하라.
//   - options.status가 있으면 그 상태의 도서만 남긴다.
//   - options.keyword가 있으면 제목 또는 저자에 keyword가 포함된 도서만 남긴다.
//     (영문 대소문자는 구분하지 않음)
//   - 두 조건이 함께 오면 두 조건을 모두 만족하는 도서만 남긴다.
//   - 조건이 없으면 전체 도서를 반환한다. 순서는 파일에 저장된 순서 그대로 둔다.
export async function findAll(options: ListOptions): Promise<Book[]> {
  throw new Error('TODO 6: findAll을 구현하세요');
}

// [제공 예시] 단건 조회 — 찾지 못하면 undefined (수정 불필요)
// 파일을 읽는 비동기 함수의 형태(async · await · Promise 반환 타입)를 참고하라.
export async function findById(id: number): Promise<Book | undefined> {
  const books = await readBooks();
  return books.find((b) => b.id === id);
}

// TODO 7: 제목과 저자가 모두 같은 도서가 이미 있으면 true, 없으면 false를 반환하라.
export async function exists(title: string, author: string): Promise<boolean> {
  throw new Error('TODO 7: exists를 구현하세요');
}

// TODO 8: 새 도서를 등록하고, 저장한 도서를 반환하라.
//   - id = 기존 도서 id의 최댓값 + 1 (도서가 없으면 1)
//   - createdAt = 현재 시각 (new Date().toISOString())
//   - [설명] 주석 한 줄로 파일 저장을 await로 기다린 뒤 반환하는 이유를 남겨라.
export async function create(input: NewBook): Promise<Book> {
  throw new Error('TODO 8: create를 구현하세요');
}

// TODO 9: 도서를 부분 수정하고, 수정한 도서를 반환하라. 대상이 없으면 undefined.
//   - changes에 전달된 필드만 변경한다.
//   - 완독(done)에서 다른 상태로 바뀌면 rating을 null로 초기화한다.
export async function update(
  id: number, changes: BookChanges,
): Promise<Book | undefined> {
  throw new Error('TODO 9: update를 구현하세요');
}

// TODO 10: 도서를 삭제하라. 삭제했으면 true, 대상이 없으면 false.
export async function remove(id: number): Promise<boolean> {
  throw new Error('TODO 10: remove를 구현하세요');
}

// TODO 11: 상태별 도서 수(want · reading · done)와 전체 도서 수(total)를 반환하라.
export async function countByStatus(): Promise<BookStats> {
  throw new Error('TODO 11: countByStatus를 구현하세요');
}
