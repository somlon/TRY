// 게시글 처리 로직 — 파일 입출력과 분리된 순수 함수 계층.
// 모든 함수는 원본 배열을 변경하지 말고 새 값을 반환하라(불변).
// toSummary는 완성 예시로 제공된다. 이 형태(중첩 접근·배열 처리·반환 타입 명시)를
// 참고하여 나머지 함수를 작성하라.

// 이름 / 학번

import type { Post, PostInput, PostStatus, Stats } from "./types.js";

// TODO 3: 배열의 첫 요소를 반환하는 제네릭 함수.
//   - 빈 배열 가능성을 반환 타입에 명시하라(T | undefined).
//   - [설명] 주석 한 줄로 반환 타입을 그렇게 정한 이유를 남겨라.
// [설명] 빈 배열이면 arr[0]이 undefined이므로 반환 타입을 T | undefined로 명시한다. 그래서 사용하는 쪽에서 ?.나 ??로 값이 없는 경우를 처리해야 한다.
export function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// TODO 4: 새 글을 추가한 '새 배열'을 반환하라(원본 posts 불변).
//   - 새 id = 기존 게시글 id의 최댓값 + 1 (배열 길이가 아님에 주의).
//   - status가 생략되면 기본값 "draft" (널 병합 ?? 활용).
//   - createdAt에는 매개변수 now를 그대로 넣는다.
export function addPost(posts: Post[], input: PostInput, now: string): Post[] {
  // 빈 배열이면 maxId가 0으로 남아 첫 글의 id는 1이 된다.
  let maxId = 0;
  for (const post of posts) {
    if (post.id > maxId) {
      maxId = post.id;
    }
  }

  const newPost: Post = {
    id: maxId + 1,
    title: input.title,
    author: input.author,
    tags: input.tags,
    status: input.status ?? "draft",
    createdAt: now,
  };

  // 원본 posts에 push하지 않고, 새 배열에 기존 글을 옮겨 담은 뒤 새 글을 추가한다.
  const result: Post[] = [];
  for (const post of posts) {
    result.push(post);
  }
  result.push(newPost);
  return result;
}

// TODO 5: 주어진 status와 일치하는 게시글만 반환하라.
export function listByStatus(posts: Post[], status: PostStatus): Post[] {
  const result: Post[] = [];
  for (const post of posts) {
    if (post.status === status) {
      result.push(post);
    }
  }
  return result;
}

// TODO 6: 주어진 tag를 tags 배열에 포함하는 게시글만 반환하라.
export function findByTag(posts: Post[], tag: string): Post[] {
  const result: Post[] = [];
  for (const post of posts) {
    if (hasTag(post.tags, tag)) {
      result.push(post);
    }
  }
  return result;
}

// tags 안에 tag가 하나라도 있으면 true. export하지 않아 이 모듈 안에서만 쓴다.
function hasTag(tags: string[], tag: string): boolean {
  for (const t of tags) {
    if (t === tag) {
      return true;
    }
  }
  return false;
}

// TODO 7: draft/published/total 개수를 집계해 Stats로 반환하라.
export function countByStatus(posts: Post[]): Stats {
  let draft = 0;
  let published = 0;
  for (const post of posts) {
    if (post.status === "draft") {
      draft++;
    } else if (post.status === "published") {
      published++;
    }
  }
  return { draft, published, total: posts.length };
}

// [제공 예시] 게시글 한 건을 사람이 읽기 좋은 한 줄 문자열로 변환한다. (수정 불필요)
export function toSummary(post: Post): string {
  const tagText =
    post.tags.length > 0 ? post.tags.map((t) => `#${t}`).join(" ") : "(태그 없음)";
  return `#${post.id} ${post.title} · ${post.author.name} · [${post.status}] · ${tagText}`;
}
