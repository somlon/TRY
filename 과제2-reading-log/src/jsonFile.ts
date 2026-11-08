// JSON 파일 읽기 · 쓰기 (제공 — 수정하지 않음)
// Node 프로젝트 관리와 내장 기능 강의록의 fs/promises를 사용함

import { readFile, writeFile } from 'node:fs/promises';

// path의 JSON 파일을 읽어 T 타입 값으로 반환함
export async function readJson<T>(path: string): Promise<T> {
  const text = await readFile(path, 'utf-8');
  try {
    return JSON.parse(text) as T;
  } catch {
    // JSON.parse의 SyntaxError를 일반 Error로 바꾸어 던짐
    // — 서버 데이터 파일의 오류가 클라이언트의 잘못된 JSON 본문(400)으로
    //   분류되지 않도록 하기 위함
    throw new Error(`데이터 파일 형식 오류: ${path}`);
  }
}

// data를 들여쓰기 2칸의 JSON 문자열로 path에 저장함
export async function writeJson<T>(path: string, data: T): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}
