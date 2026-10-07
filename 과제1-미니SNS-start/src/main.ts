// 실행 데모 — 작성한 함수들을 고정된 시나리오로 호출해 결과를 출력한다.
// 이 파일은 제공되며, 경로 구성 부분은 수정하지 않는다.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadPosts } from "./store.js";
import {
  addPost,
  listByStatus,
  findByTag,
  countByStatus,
  toSummary,
  first,
} from "./service.js";
import type { User } from "./types.js";

// import.meta.url 기준으로 data 폴더 경로를 구성 — 실행 위치에 무관하게 동작한다.
const here = dirname(fileURLToPath(import.meta.url));
const dataPath = join(here, "..", "data", "posts.seed.json");

async function main(): Promise<void> {
  const posts = await loadPosts(dataPath);
  console.log(`불러온 게시글: ${posts.length}개`);

  const me: User = { id: 1, name: "김명지" };
  const updated = addPost(
    posts,
    { title: "첫 백엔드 과제", author: me, tags: ["node", "ts"], status: "published" },
    "2026-03-20T09:00:00.000Z",
  );

  console.log("── 전체 요약 ──");
  for (const p of updated) console.log("  " + toSummary(p));

  console.log("published 개수:", listByStatus(updated, "published").length);
  console.log("#node 태그 개수:", findByTag(updated, "node").length);
  console.log("집계:", countByStatus(updated));
  console.log("첫 게시글:", first(updated)?.title ?? "(없음)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
