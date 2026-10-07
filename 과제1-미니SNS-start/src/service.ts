// 게시글 처리 로직 — 파일 입출력과 분리된 순수 함수 계층.
// 모든 함수는 원본 배열을 변경하지 말고 새 값을 반환하라(불변).
// toSummary는 완성 예시로 제공된다. 이 형태(중첩 접근·배열 처리·반환 타입 명시)를
// 참고하여 나머지 함수를 작성하라.

// 이름 / 학번

import type { Post, PostInput, PostStatus, Stats } from "./types.js";

// TODO 3: 배열의 첫 요소를 반환하는 제네릭 함수.
//   - 빈 배열 가능성을 반환 타입에 명시하라(T | undefined).
//   - [설명] 주석 한 줄로 반환 타입을 그렇게 정한 이유를 남겨라.
export function first<T>(arr: T[]): T | undefined {
  throw new Error("TODO: first를 구현하세요");
}

// TODO 4: 새 글을 추가한 '새 배열'을 반환하라(원본 posts 불변).
//   - 새 id = 기존 게시글 id의 최댓값 + 1 (배열 길이가 아님에 주의).
//   - status가 생략되면 기본값 "draft" (널 병합 ?? 활용).
//   - createdAt에는 매개변수 now를 그대로 넣는다.
export function addPost(posts: Post[], input: PostInput, now: string): Post[] {
  throw new Error("TODO: addPost를 구현하세요");
}

// TODO 5: 주어진 status와 일치하는 게시글만 반환하라.
export function listByStatus(posts: Post[], status: PostStatus): Post[] {
  throw new Error("TODO: listByStatus를 구현하세요");
}

// TODO 6: 주어진 tag를 tags 배열에 포함하는 게시글만 반환하라.
export function findByTag(posts: Post[], tag: string): Post[] {
  throw new Error("TODO: findByTag를 구현하세요");
}

// TODO 7: draft/published/total 개수를 집계해 Stats로 반환하라.
export function countByStatus(posts: Post[]): Stats {
  throw new Error("TODO: countByStatus를 구현하세요");
}

// [제공 예시] 게시글 한 건을 사람이 읽기 좋은 한 줄 문자열로 변환한다. (수정 불필요)
export function toSummary(post: Post): string {
  const tagText =
    post.tags.length > 0 ? post.tags.map((t) => `#${t}`).join(" ") : "(태그 없음)";
  return `#${post.id} ${post.title} · ${post.author.name} · [${post.status}] · ${tagText}`;
}
