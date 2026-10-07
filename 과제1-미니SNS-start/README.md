# 과제 1 — 파일 기반 미니 SNS 콘솔 애플리케이션

- 이름 / 학번:
- 과목: 고급웹프로그래밍

게시글을 JSON 파일에 저장·조회·집계하는 콘솔 프로그램을 TypeScript로 구현했다.

## 1. 실행 방법

`package.json`이 있는 이 폴더에서 실행한다.

```bash
npm install     # typescript, tsx, @types/node 설치
npm run check   # tsc --noEmit — JS를 만들지 않고 타입 검사만 수행
npm start       # tsx src/main.ts — 컴파일 없이 바로 실행
```

실행 결과:

```
불러온 게시글: 3개
── 전체 요약 ──
  #1 명지대 고급웹 시작 · 이수진 · [published] · #node #intro
  #2 타입스크립트 초안 정리 · 박도윤 · [draft] · #ts
  #3 비동기와 async/await · 이수진 · [published] · #ts #async
  #4 첫 백엔드 과제 · 김명지 · [published] · #node #ts
published 개수: 3
#node 태그 개수: 2
집계: { draft: 1, published: 3, total: 4 }
첫 게시글: 명지대 고급웹 시작
```

## 2. 타입 설계 이유

| 타입 | 설계 이유 |
|---|---|
| `PostStatus` | `"draft" \| "published"` 리터럴 유니언으로 허용 값을 제한해 오타를 실행 전에 잡는다. 유니언이라 `type`으로 선언했다. |
| `Post` | 객체 구조라 `interface`로 선언하고, 작성자는 `author: User`로 중첩했다. |
| `PostInput` | `id`·`createdAt`은 시스템이 만들기 때문에 빼고, `status`는 생략할 수 있게(`?`) 했다. |
| `Stats` | 집계 결과의 형태를 고정해 `countByStatus`의 반환 타입으로 쓴다. |
| `first<T>` | 제네릭이라 어떤 배열에도 쓸 수 있고, 빈 배열이면 `undefined`이므로 `T \| undefined`를 반환한다. |

`any`는 쓰지 않았다. `JSON.parse`의 반환은 `any`이므로 `as Post[]`로 타입을 지정했다.

## 3. 함수 설명

`service.ts`의 함수는 받은 값으로만 계산하고 원본 배열을 바꾸지 않는 순수 함수다.

| 함수 | 설명 |
|---|---|
| `first` | 배열의 첫 요소를 반환한다. 빈 배열이면 `undefined`를 반환한다. |
| `addPost` | 기존 id의 최댓값 + 1로 새 글을 만들고(`status`가 없으면 `"draft"`), 기존 글을 옮겨 담은 새 배열에 추가해 반환한다. |
| `listByStatus` | `status`가 같은 글만 새 배열로 반환한다. |
| `findByTag` | `tags`에 해당 태그가 있는 글만 새 배열로 반환한다. |
| `countByStatus` | `draft`·`published` 개수와 전체 개수(`total`)를 반환한다. |
| `toSummary` (제공) | 글 한 건을 한 줄 문자열로 만든다. |
| `loadPosts` | `fs/promises`의 `readFile`을 `await`로 읽고 `JSON.parse`로 게시글 배열로 바꾼다. |
| `savePosts` | `JSON.stringify(posts, null, 2)`로 만든 문자열을 `writeFile`로 저장한다. |

지정 주석 `// [설명]` 위치: `types.ts` 16행(PostStatus 유니언), `service.ts` 13행(first 반환 타입), `store.ts` 12행(fs await 근거).

## 4. 오류 기록

### 오류 1

```
error TS2688: Cannot find type definition file for 'node'.
```

- 원인: `npm install` 전이라 `tsconfig.json`의 `"types": ["node"]`가 가리키는 `@types/node`가 없었다.
- 해결: 프로젝트 폴더에서 `npm install`을 실행해 devDependencies를 설치하면 해결된다.

### 오류 2

```
src/service.ts(43,10): error TS2339: Property 'tags' does not exist on type 'Post'.
src/service.ts(43,43): error TS7006: Parameter 't' implicitly has an 'any' type.
```

- 원인: TODO 2 전이라 `interface Post`가 비어 있어서 `post.tags` 같은 접근이 모두 오류였다. TS7006은 같은 원인으로 생긴 연쇄 오류다.
- 해결: `Post`에 속성 6개를 정의하자 오류가 모두 사라졌다.

### 오류 3

```
error TS2345: Argument of type '"publised"' is not assignable to parameter of type 'PostStatus'.
```

- 원인: `"publised"`는 `PostStatus`에 없는 값(오타)이다.
- 해결: `"published"`로 고쳤다. 리터럴 유니언이 오타를 실행 전에 잡는 것을 확인했다.

## 5. AI 활용 보고

- 도구: Claude Code
- 사용 부분: TODO 1~9 코드 구현, 타입 검사·실행 결과 검증, README 초안과 지정 주석 문구 작성
- 방식: 과제 PDF와 강의록 1~5강을 주고, 강의에 나온 개념과 방식만 사용하도록 조건을 걸었다.
- 본인 확인:
