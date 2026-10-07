// 저장소 계층 — JSON 파일과 게시글 배열 사이의 읽기·쓰기를 담당한다.
// Node 프로젝트 관리와 내장 기능 강의록의 fs/promises·async/await를 적용하라.

// 이름 / 학번

import { readFile, writeFile } from "node:fs/promises";
import type { Post } from "./types.js";

// TODO 8: path의 JSON 파일을 읽어 Post 배열로 반환하라.
//   - fs/promises의 readFile을 await로 호출하고, JSON.parse로 변환한다.
//   - [설명] 주석 한 줄로 왜 비동기 API + await를 쓰는지 근거를 남겨라.
export async function loadPosts(path: string): Promise<Post[]> {
  throw new Error("TODO: loadPosts를 구현하세요");
}

// TODO 9: posts를 보기 좋게(들여쓰기 2칸) JSON 문자열로 만들어 path에 저장하라.
export async function savePosts(path: string, posts: Post[]): Promise<void> {
  throw new Error("TODO: savePosts를 구현하세요");
}
