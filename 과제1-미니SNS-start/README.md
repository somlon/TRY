# 과제 1 — 파일 기반 미니 SNS 콘솔 애플리케이션

> **[초안 메모]** 이 README는 AI(Claude Code)가 강의록 1~5강 기준으로 만든 초안입니다.
> 과제 요구사항이 "본인 언어로 기술"이므로, 제출 전에 직접 읽고 본인 표현으로 고쳐 주세요.
> `[초안 메모]`·`[본인 작성]` 표시가 있는 줄은 정리한 뒤 지웁니다.

- 이름 / 학번: [본인 작성]
- 과목: 고급웹프로그래밍 (명지대학교 융합소프트웨어학부)

게시글을 JSON 파일에서 읽어 와 새 글 추가·상태별 조회·태그 검색·집계를 하는 콘솔 프로그램입니다.
TypeScript의 타입(interface·리터럴 유니언·제네릭)과 비동기(Promise·async/await), ESM 모듈, `fs/promises` 파일 입출력을 하나의 실행 프로그램으로 묶었습니다.

---

## 1. 실행 방법

이 폴더(`package.json`이 있는 위치)에서 실행합니다. 다른 폴더에서 실행하면 `package.json`을 찾지 못합니다.

```bash
npm install      # devDependencies(typescript, tsx, @types/node)를 설치해 node_modules 생성
npm run check    # tsc --noEmit — JS 파일을 만들지 않고 타입 검사만 수행 (오류 0개 확인)
npm start        # tsx src/main.ts — 별도 컴파일 없이 TS를 바로 실행
npm run dev      # tsx watch src/main.ts — 저장할 때마다 자동 재실행 (개발용)
```

- `tsx`는 속도를 위해 타입 검사를 생략하고 실행만 합니다. 그래서 타입 오류가 있어도 실행은 될 수 있고, **검사는 `npm run check`(tsc --noEmit)가 담당**합니다. 제출 전 최종 기준은 `npm run check` 오류 0개입니다.
- `node_modules`는 `package.json`과 `package-lock.json`만 있으면 `npm install`로 언제든 복원할 수 있으므로 제출물에서 뺍니다.

### 실행 결과

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

### 폴더 구조와 모듈 역할

```
과제1-미니SNS-start/
├── package.json          # 프로젝트 신분증 — "type": "module"(ESM), scripts, devDependencies
├── tsconfig.json         # strict: true, module: nodenext, types: ["node"]
├── data/posts.seed.json  # 시드 게시글 3개
└── src/
    ├── types.ts          # 타입 정의 (User, PostStatus, Post, PostInput, Stats)
    ├── service.ts        # 게시글 처리 — 파일 입출력과 분리된 순수 함수
    ├── store.ts          # 저장소 — JSON 파일 ↔ 게시글 배열 읽기·쓰기
    └── main.ts           # 실행 진입점 (제공 파일)
```

- 기능별로 파일(모듈)을 나누고, 필요한 것만 `export`해서 다른 파일이 `import`로 가져다 씁니다.
- ESM 경로 규칙에 따라 상대경로는 `./`로 시작하고 확장자 `.js`까지 적습니다(`import ... from "./service.js"`).
- Node 내장 모듈은 `node:` 접두어로 가져옵니다(`node:fs/promises`, `node:path`, `node:url`).
- `main.ts`는 `import.meta.url` + `fileURLToPath` + `dirname`으로 현재 파일 위치를 구하고, `node:path`의 `join`으로 `data/posts.seed.json` 경로를 만듭니다. 그래서 명령을 실행한 위치(`process.cwd()`)와 관계없이 같은 파일을 찾습니다. ESM에서는 `__dirname`을 바로 쓸 수 없기 때문입니다.

---

## 2. 타입 설계 이유

수업 규칙대로 **객체의 구조는 `interface`, 유니언·간단한 별칭은 `type`**으로 구분했습니다.

| 타입 | 정의 | 이렇게 정한 이유 |
|---|---|---|
| `User` | `interface` — `id`, `name`, `email?` | 반복되는 객체 형태에 이름을 붙였습니다. `email`은 없을 수도 있으므로 옵셔널(`?`)이고, 실제 타입은 `string \| undefined`입니다. |
| `PostStatus` | `type PostStatus = "draft" \| "published"` | 허용되는 값이 두 개뿐입니다. `string`으로 두면 `"publised"` 같은 오타도 통과하지만, 리터럴 유니언은 허용 값의 집합 자체가 타입이 되어 오타를 실행 전에 잡습니다. 유니언이므로 `type`을 썼습니다. |
| `Post` | `interface` — `id`, `title`, `author: User`, `tags: string[]`, `status: PostStatus`, `createdAt: string` | 게시글이 작성자를 "가지고 있는" 관계라서 `author`에 `User`를 **중첩**했습니다. `status`에는 위의 유니언을 써서 게시글 상태도 두 값으로 제한됩니다. |
| `PostInput` | `interface` — `title`, `author`, `tags`, `status?` | 새 글을 쓸 때 `id`와 `createdAt`은 시스템이 만들기 때문에 빠져 있습니다. `status`는 생략할 수 있고, 생략하면 `??`로 `"draft"`가 들어갑니다. |
| `Stats` | `interface` — `draft`, `published`, `total` | 집계 결과의 형태를 이름으로 고정해서 `countByStatus`의 반환 타입으로 씁니다. |

그 밖의 타입 결정은 다음과 같습니다.

- **`first<T>(arr: T[]): T | undefined`** — 제네릭으로 "재사용"과 "타입 안전"을 함께 얻습니다(`string[]`을 넣으면 `string`, `Post[]`을 넣으면 `Post`). 빈 배열이면 `arr[0]`이 `undefined`이므로 그 가능성까지 반환 타입에 적었습니다. 그래서 `main.ts`는 `first(updated)?.title ?? "(없음)"`처럼 `?.`와 `??`로 안전하게 씁니다.
- **`Promise<Post[]>`, `Promise<void>`** — `async` 함수는 항상 Promise를 반환하므로, 성공했을 때 `await`로 받는 값의 타입을 `Promise<T>`의 `T`로 적었습니다. `savePosts`는 돌려줄 값이 없어서 `Promise<void>`입니다.
- **`any` 사용 0회** — `JSON.parse`의 반환은 `any`이므로 강의 방식대로 `as Post[]`로 타입을 지정했습니다. 단, `as`는 컴파일러에게 알려 줄 뿐 실제 값을 검사하지는 않습니다(→ 개선 아이디어 2).
- **`strict: true`** — null 검사(strictNullChecks)와 암묵적 any 금지(noImplicitAny)가 켜져 있습니다. 값이 없을 수 있는 자리를 그냥 쓰지 못하게 막아 줍니다.

---

## 3. 함수 설명

`service.ts`의 함수는 모두 **순수 함수**입니다. 받은 값으로만 계산하고, 원본 배열을 바꾸지 않고 새 값을 돌려줍니다. `addPost`가 현재 시각을 직접 구하지 않고 `now`를 매개변수로 받는 것도 이 때문입니다.

| 함수 | 시그니처 | 동작 |
|---|---|---|
| `first<T>` | `(arr: T[]) => T \| undefined` | `arr[0]`을 반환합니다. 빈 배열이면 `undefined`입니다. |
| `addPost` | `(posts, input, now) => Post[]` | ① `for...of`로 기존 id의 **최댓값**을 찾습니다(빈 배열이면 0). ② `id: 최댓값 + 1`, `status: input.status ?? "draft"`, `createdAt: now`로 새 글을 만듭니다. ③ 새 배열에 기존 글을 옮겨 담고 새 글을 `push`해서 반환합니다. 원본 `posts`에는 `push`하지 않습니다. |
| `listByStatus` | `(posts, status) => Post[]` | `for...of`로 돌며 `post.status === status`인 글만 새 배열에 담습니다. |
| `findByTag` | `(posts, tag) => Post[]` | 글마다 내부 함수 `hasTag(post.tags, tag)`로 태그가 있는지 확인해 새 배열에 담습니다. `hasTag`는 `export`하지 않아 모듈 안에서만 씁니다. |
| `countByStatus` | `(posts) => Stats` | `draft`·`published` 개수를 세고 `total`은 `posts.length`로 해서 `{ draft, published, total }`을 반환합니다. |
| `toSummary` (제공) | `(post) => string` | 글 한 건을 `#id 제목 · 작성자 · [상태] · #태그` 한 줄로 만듭니다. |
| `loadPosts` | `(path) => Promise<Post[]>` | `await readFile(path, "utf8")`로 문자열을 읽고 `JSON.parse(text) as Post[]`로 배열로 바꿉니다. |
| `savePosts` | `(path, posts) => Promise<void>` | `JSON.stringify(posts, null, 2)`로 들여쓰기 2칸 문자열을 만들어 `await writeFile(...)`로 저장합니다. 파일에는 문자열만 저장할 수 있기 때문입니다. |

- **id를 "배열 길이 + 1"이 아니라 "최댓값 + 1"로 한 이유**: 글이 삭제되어 id가 `[1, 3]`처럼 비면, 길이 + 1 = 3이 되어 기존 id와 겹칩니다. 시드 데이터(id 1, 2, 3)에서는 두 방식의 결과가 같아서 실행 결과만으로는 차이가 드러나지 않습니다. 그래서 id가 `[2, 7]`인 배열로 따로 확인했고, 새 id가 8로 나왔습니다.
- **`main.ts`의 흐름**: `async function main()` 안에서 `await loadPosts(...)`로 파일을 다 읽은 뒤에 나머지 순수 함수를 차례로 호출합니다. 실패하면 `main().catch(...)`가 오류를 출력하고 `process.exit(1)`로 종료합니다.

### 지정 주석 3곳 (`// [설명]`)

| 위치 | 내용 요약 |
|---|---|
| `src/types.ts` 16행 | PostStatus를 리터럴 유니언으로 한 이유 — 허용 값 집합을 타입으로 정해 오타를 컴파일 단계에서 잡음 |
| `src/service.ts` 13행 | `first`의 반환 타입이 `T \| undefined`인 이유 — 빈 배열 가능성을 드러내 호출하는 쪽에서 처리하게 함 |
| `src/store.ts` 12행 | 비동기 API + `await`를 쓰는 이유 — 동기 API는 이벤트 루프를 막음, `await`는 그 async 함수 안에서만 기다림 |

`fs/promises`를 쓰는 이유를 조금 더 풀면 이렇습니다. Node.js는 JavaScript를 하나의 이벤트 루프 스레드에서 실행합니다. 파일 읽기 같은 오래 걸리는 I/O를 `readFileSync`로 하면 끝날 때까지 다른 일을 못 합니다. `fs/promises`의 `readFile`은 작업을 백그라운드에 맡기고 Promise를 바로 돌려줍니다. `await`는 그 async 함수만 잠시 멈추고 결과가 오면 이어서 실행합니다. `await`를 빼면 `string` 대신 `Promise<string>`을 받게 되어 타입 오류가 납니다.

---

## 4. 오류 기록

> **[초안 메모]** 아래는 Claude가 작업하면서 실제로 받은 tsc 메시지 원문입니다.
> 직접 같은 상황을 재현해 본인이 본 메시지로 확인하고, 해결 과정도 본인 말로 고쳐 주세요.

### 오류 1 — `@types/node`가 설치되지 않음

```
error TS2688: Cannot find type definition file for 'node'.
  The file is in the program because:
    Entry point of type library 'node' specified in compilerOptions
```

- **상황**: `npm install`을 하지 않은 상태에서 타입 검사를 실행했습니다.
- **원인**: `tsconfig.json`에 `"types": ["node"]`가 있는데, Node 내장 기능(fs, path 등)의 타입 정의 묶음인 `@types/node`가 `node_modules`에 없었습니다.
- **해결**: 프로젝트 폴더에서 `npm install`을 실행해 devDependencies(`typescript`, `tsx`, `@types/node`)를 설치한 뒤 다시 `npm run check`를 실행합니다.
  - [초안 메모] Claude는 외부 다운로드를 하지 않기 위해 `npm install` 대신 작업 환경에 이미 있던 `@types/node`를 지정해서 검사했습니다.

### 오류 2 — `Post` interface가 비어 있음 (스타터 상태, 총 8개)

```
src/main.ts(38,41): error TS2339: Property 'title' does not exist on type 'Post'.
src/service.ts(43,10): error TS2339: Property 'tags' does not exist on type 'Post'.
src/service.ts(43,43): error TS7006: Parameter 't' implicitly has an 'any' type.
src/service.ts(44,19): error TS2339: Property 'id' does not exist on type 'Post'.
...
```

- **읽는 법**: ① 무엇이 — `'tags'` 속성, ③ 어디에 — `'Post'` 타입에 없다.
- **원인**: TODO 2를 하기 전이라 `interface Post {}`가 비어 있었습니다. 그래서 제공된 `toSummary`와 `main.ts`에서 `post.tags`, `post.id` 같은 접근이 모두 오류였습니다. TS7006은 `post.tags`의 타입을 알 수 없어 `map` 콜백의 `t`가 암묵적 `any`가 된 것입니다(strict의 noImplicitAny). 원인이 같은 연쇄 오류입니다.
- **해결**: TODO 2에서 `Post`에 `id`, `title`, `author: User`, `tags: string[]`, `status: PostStatus`, `createdAt: string`을 정의하자 8개가 한꺼번에 사라졌습니다. 값의 문제가 아니라 타입 선언의 문제였기 때문에 타입 쪽을 고쳤습니다.

### 오류 3 — 상태 값 오타 (리터럴 유니언 확인)

```
error TS2345: Argument of type '"publised"' is not assignable to parameter of type 'PostStatus'.
```

- **상황**: PostStatus를 리터럴 유니언으로 바꾼 뒤, 오타가 정말 잡히는지 확인하려고 `listByStatus([], "publised")`를 일부러 작성했습니다.
- **원인**: `"publised"`는 `"draft" | "published"`에 없는 값입니다.
- **해결**: `"published"`로 고치면 통과합니다. `PostStatus = string`이었다면 이 오타는 검사를 통과하고, 실행 결과가 조용히 0개로 나오는 버그가 되었을 것입니다.

---

## 5. AI 활용 보고

> **[초안 메모]** 아래는 이번 작업에서 실제로 있었던 일입니다. 본인이 직접 한 부분과 이해한 내용은 `[본인 작성]` 칸에 채워 주세요.

- **사용 도구**: Claude Code (Anthropic의 AI 코딩 도구)
- **사용한 부분과 방식**
  1. **과제 이해** — 과제 PDF와 스타터 코드를 주고 구조와 요구사항 설명을 요청했습니다.
  2. **코드 구현** — 강의록 1~5강 PDF를 함께 주고 "강의에 나온 개념과 방식만 사용"하라는 조건으로 TODO 1~9 구현을 요청했습니다. 그래서 강의록에 나오지 않는 `filter`, `includes`, 스프레드(`...`) 대신 강의에서 다룬 `for...of`와 `push`로 구현되었습니다.
  3. **검증** — AI가 타입 검사(오류 0개), 실행 결과와 과제 기대 출력 비교, 원본 불변·id 최댓값·빈 배열·저장 후 다시 읽기 확인을 했습니다.
  4. **문서** — 이 README 초안을 작성했습니다.
  5. **지정 주석 수정** — `[설명]` 주석 3곳을 강의록 PDF 표현을 근거로 대학생 수준에서 간결하게 다시 쓰도록 요청했고, 이어서 어미를 "~한다/~준다" 같은 문장형으로 맞추도록 요청했습니다. 주석 문구만 바뀌었고 코드 동작은 그대로입니다.
- **본인이 확인·수정한 부분**: [본인 작성 — 예: 각 함수를 직접 읽고 설명해 본 내용, 직접 실행해 본 결과, 수정한 부분]
- **이해 확인**: [본인 작성 — 예: `addPost`가 원본을 바꾸지 않는 이유, `first`가 `T | undefined`를 반환하는 이유를 본인 말로]

---

## 6. 개선 아이디어

1. **파일이 없을 때 처리** — 지금 `loadPosts`는 파일이 없으면 오류로 종료됩니다. 강의(5강)의 패턴대로 `catch (error: unknown)`에서 `error instanceof Error && "code" in error && error.code === "ENOENT"`일 때만 빈 배열을 반환하고, 그 외 오류는 다시 던지면 "없으면 빈 목록으로 시작"할 수 있습니다.
2. **JSON 내용 검증** — `JSON.parse(...) as Post[]`는 컴파일러에게 타입을 알려 줄 뿐입니다. 파일 내용이 잘못되어도 실행 중에야 문제가 드러납니다. 외부에서 온 값은 `unknown`으로 받고, 좁히기(`typeof`, `in`)로 확인한 뒤 쓰면 더 안전합니다.
3. **저장까지 연결해 영속성 확인** — `main.ts`는 `savePosts`를 호출하지 않아서, 추가한 글이 프로그램을 끄면 사라집니다. 시드 파일은 그대로 두고 `path.join`으로 만든 별도 파일(예: `data/posts.json`)에 저장하면, 다시 실행했을 때 글이 누적되는지 확인할 수 있습니다.
4. **명령줄 인자로 동작 선택** — `process.argv`로 태그나 상태를 입력받으면(예: `npm start -- node`) 고정 시나리오가 아닌 CLI 도구가 됩니다.
5. **`.gitignore` 추가** — GitHub에 올릴 때 `node_modules`가 올라가지 않도록 `.gitignore`에 `node_modules`를 적습니다.
6. **JSON 파일 저장소의 한계** — "읽기 → 수정 → 저장"은 단순하지만, 동시에 여러 요청이 들어오면 서로 덮어쓸 수 있습니다. 이후 데이터베이스(Prisma)로 저장 계층(`store.ts`)만 바꾸면, 파일 입출력과 분리해 둔 `service.ts`는 그대로 쓸 수 있습니다.
