// 미니 SNS 도메인 타입 정의
// TypeScript 기초 II 강의록의 interface·리터럴 유니언·중첩을 적용해 완성하라.

// 이름 / 학번

export interface User {
  id: number;
  name: string;
  email?: string; // 옵셔널 속성
}

// TODO 1: 게시글 상태 타입을 리터럴 유니언으로 정의하라.
//   - 허용 값은 "draft" 와 "published" 두 가지뿐이다.
//   - 단순 string으로 두지 말 것(오타가 컴파일 단계에서 걸리지 않는다).
//   - [설명] 주석 한 줄로 왜 리터럴 유니언을 썼는지 근거를 남겨라.
// [설명] 허용 값이 "draft"·"published" 둘뿐이므로 string 대신 리터럴 유니언으로 값의 집합 자체를 타입으로 정해, "publised" 같은 오타를 실행 전(tsc --noEmit)에 컴파일 오류로 잡는다.
export type PostStatus = "draft" | "published";

// TODO 2: 게시글 형태를 interface로 정의하라. 아래 속성을 포함한다.
//   id: number / title: string / author: User(중첩) / tags: string[] /
//   status: PostStatus / createdAt: string
export interface Post {
  id: number;
  title: string;
  author: User; // interface 중첩 — 게시글이 작성자(User)를 "가지고 있다"
  tags: string[];
  status: PostStatus;
  createdAt: string;
}

// 새 글 작성 입력 — id·createdAt은 시스템이 생성하므로 제외, status는 선택.
export interface PostInput {
  title: string;
  author: User;
  tags: string[];
  status?: PostStatus;
}

export interface Stats {
  draft: number;
  published: number;
  total: number;
}
