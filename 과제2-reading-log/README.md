# 과제 2 — 독서 기록 REST API 서버

> 이 README는 **제출물의 일부(20%)** 입니다. 모든 항목을 본인의 언어로 작성해 주세요.
> 코드를 복사만 하고 이해하지 못하면 이 문서를 작성하기 어렵습니다.

- 이름:
- 학번:

---

## 1. 실행 방법

`package.json`이 있는 이 폴더에서 실행한다. 포트와 데이터 파일 경로는 `.env`(`PORT`, `DATA_FILE`)에서 읽는다.

```bash
npm install     # 의존성 설치 (express · morgan, 개발 도구 typescript · tsx · @types/*)
npm run check   # tsc --noEmit — JS를 만들지 않고 타입 검사만 수행 (오류 0개 확인)
npm run dev     # tsx watch로 서버 실행 → http://localhost:3000
npm run reset   # data/books.seed.json을 data/books.json으로 복사해 초기 데이터로 되돌림
```

요청 확인은 `requests.http`를 VS Code REST Client로 실행한다. 기대 결과(id 28 등)가 맞으려면 `npm run reset` 직후 1번부터 순서대로 실행한다.

## 2. 구조 · 동작 설명

요청은 `app.ts` → `routes/bookRouter.ts` → `controllers/bookController.ts` → `store.ts` → `jsonFile.ts` 순서로 전달되고, 응답은 미들웨어 또는 Controller가 보낸다.

**Q1.** `requestTimer`를 app.ts에 `app.use`로 장착한 경우와 bookRouter에 `router.use`로 장착한 경우, `GET /users` 요청의 콘솔 로그는 어떻게 달라지는가? 그 이유를 장착 위치와 요청 경로로 설명하시오.

- **bookRouter에 장착(현재 코드)** — `GET /users`는 morgan 로그만 남고 `[time]` 로그는 남지 않는다.
  ```
  GET /users 404 0.412 ms - 31
  ```
  `app.ts`에서 Router를 `app.use('/books', bookRouter)`로 장착했으므로 경로가 `/books`로 시작하는 요청만 bookRouter로 들어간다. `requestTimer`는 bookRouter 안의 `router.use(requestTimer)`에 있으므로 bookRouter에 들어온 요청에만 실행된다. `/users`는 bookRouter를 거치지 않고 `app.use(notFound)`가 404로 응답하므로 `res.on('finish', …)` 리스너가 등록되지 않는다.
- **app.ts에 `app.use(requestTimer)`로 장착한 경우** — 경로 없이 `app.use`로 장착한 미들웨어는 모든 요청에 실행된다. `GET /users`도 requestTimer를 지나며 리스너를 등록하고, notFound가 404를 보낸 뒤 `[time]` 줄이 추가로 찍힌다. 별도 포트에서 이렇게 장착한 앱으로 직접 확인한 로그:
  ```
  GET /users 404 1.562 ms - 31
  [time] GET /users 404 3ms
  ```
- 같은 이유로, 잘못된 JSON 본문을 보낸 `POST /books`(requests.http 18번)도 `[time]` 로그가 없다. `app.ts`의 `express.json()`이 bookRouter보다 먼저 실행되어 본문 해석에 실패하면 Router에 들어가기 전에 바로 errorHandler로 가기 때문이다.

**Q2.** `POST /books`에서 400 · 409, `GET /books/:id`에서 400 · 404는 각각 어느 모듈(미들웨어 · Controller · Store)에서 결정되는가? Store가 상태 코드를 정하지 않도록 구성한 이유는 무엇인가?

| 요청 | 상태 코드 | 결정하는 곳 | 근거 코드 |
|---|---|---|---|
| `POST /books` | 400 (입력 오류) | Controller `create` | `toRequiredText` · `isReadingStatus` · `isRatingValue` · `isRatingAllowed` 검사 후 `res.status(400)` |
| `POST /books` | 400 (JSON 문법 오류) | 미들웨어 `errorHandler` | `express.json()`이 넘긴 `SyntaxError`를 `err instanceof SyntaxError`로 구분 |
| `POST /books` | 409 | Controller `create` | `await store.exists(title, author)`가 `true`를 반환하면 `res.status(409)` |
| `GET /books/:id` | 400 | 미들웨어 `validateId` | `Number.isInteger(id)`가 아니거나 `id < 1`이면 응답하고 `return` → Controller는 실행되지 않음 |
| `GET /books/:id` | 404 | Controller `getById` | `store.findById`가 `undefined`를 반환하면 `res.status(404)` |

- Store는 `exists`가 `boolean`, `findById`가 `Book | undefined`처럼 **데이터와 결과만 반환**하고, 그 결과를 몇 번 상태 코드로 바꿀지는 Controller가 정한다(`store.ts` 첫 주석: "HTTP를 알지 못한다").
- 이렇게 나눈 이유
  - 역할 분리 — Store는 데이터 조회 · 저장 · 삭제만, Controller는 요청 해석 · 검증 · 응답 결정만 맡아 각 파일이 하나의 일만 한다.
  - 교체 가능성 — 나중에 JSON 파일을 데이터베이스로 바꿔도 Store 함수의 이름과 반환값만 같으면 Controller는 고칠 필요가 없다.
  - 재사용 — 같은 결과라도 요청에 따라 의미가 다르다. 예를 들어 `findById`의 `undefined`는 GET에서는 404이지만, 다른 기능에서는 오류가 아닐 수 있다. Store가 상태 코드를 정하면 이런 판단을 할 수 없다.

**Q3.** `data/books.json`의 내용이 손상되어 JSON 형식이 아니면, 핸들러에 try/catch가 없는데도 500 응답이 전송된다. 오류가 발생한 위치부터 응답이 전송될 때까지의 과정을 설명하시오. (`jsonFile.ts`가 오류를 바꾸어 던지는 이유도 포함)

`data/books.json`을 `{ broken`으로 바꾸고 `GET /books`를 보내 직접 확인했다 → `500 {"message":"데이터 파일 형식 오류: data/books.json"}`.

1. **오류 발생** — `jsonFile.ts`의 `readJson`에서 `readFile`은 성공하지만 `JSON.parse(text)`가 `SyntaxError`를 던진다. `readJson`은 이를 `catch`로 받아 `new Error('데이터 파일 형식 오류: …')`로 바꿔 다시 던진다.
2. **Promise 거부 전달** — `readJson` → `readBooks` → `store.findAll` → Controller `list`가 모두 `async` 함수이고 `await`로 연결되어 있으므로, 던진 오류는 각 함수가 반환한 Promise의 reject로 바깥까지 전달된다. 결국 `list`가 반환한 Promise가 거부된다.
3. **Express 5의 자동 전달** — Express 5는 async 핸들러가 반환한 Promise가 거부되면 그 오류를 `next(err)`로 넘긴 것처럼 처리한다. 그래서 `list`에 try/catch가 없어도 일반 미들웨어(`notFound`)를 건너뛰고, `app.ts` 맨 마지막에 등록한 4개 매개변수 미들웨어 `errorHandler`로 이동한다.
4. **응답 전송** — `errorHandler`는 응답이 아직 시작되지 않았으므로(`res.headersSent`가 false) `console.error(err)`로 서버 콘솔에 기록한다. `err instanceof SyntaxError`가 아니므로 `500 { message: err.message }`를 보낸다.

**`jsonFile.ts`가 오류를 바꾸어 던지는 이유** — `errorHandler`는 `SyntaxError`를 "클라이언트가 보낸 JSON 본문이 잘못됨(400)"으로 판단한다. 데이터 파일의 `SyntaxError`를 그대로 던지면, 서버 자신의 데이터 문제인데도 클라이언트 잘못(400)으로 잘못 분류된다. 일반 `Error`로 바꾸면 서버 오류(500)로 처리된다.

## 3. 겪은 오류와 해결 (최소 2건)

- **오류 1 — 한글 검색어 요청 실패 (요청 중)**
  - 메시지
    ```
    UnicodeEncodeError: 'ascii' codec can't encode character '김' in position 31: ordinal not in range(128)
    ```
  - 상황: requests.http 1~19를 순서대로 자동 실행하는 점검용 Python 스크립트로 3번 `GET /books?status=done&keyword=김`을 보낼 때 발생했다. 1 · 2번은 정상 응답했다.
  - 원인: URL의 한글 `김`을 퍼센트 인코딩하지 않고 그대로 보냈다. HTTP 요청 줄에는 ASCII 문자만 들어갈 수 있다. 서버 코드의 문제가 아니라 요청을 보내는 쪽의 문제였다.
  - 해결: 요청을 보내기 전에 URL을 퍼센트 인코딩하도록 스크립트를 고쳤다(`김` → `%EA%B9%80`). 그 뒤 3번이 `200 · 3권`으로 응답했다. REST Client는 이 인코딩을 자동으로 한다. 서버의 `[time]` 로그에도 `GET /books?status=done&keyword=%EA%B9%80`처럼 인코딩된 원래 URL(`req.originalUrl`)이 찍힌다.
- **오류 2 — 데이터 파일 손상 (Q3 확인을 위해 의도적으로 재현)**
  - 메시지
    ```
    Error: 데이터 파일 형식 오류: data/books.json
        at readJson (/home/user/TRY/과제2-reading-log/src/jsonFile.ts:15:11)
    ```
    응답: `500 {"message":"데이터 파일 형식 오류: data/books.json"}`
  - 원인: `data/books.json`이 JSON 형식이 아니어서 `JSON.parse`가 실패했다. `jsonFile.ts`가 이를 일반 `Error`로 바꿔 던졌고, `errorHandler`가 500으로 응답했다.
  - 해결: `npm run reset`으로 `data/books.seed.json`을 복사해 데이터 파일을 복구했다. 그 뒤 `GET /books`가 다시 200으로 응답했다.

## 4. AI 활용 보고

- **사용 도구**: Claude Code(Anthropic). 웹 클라우드 환경에서 사용했다.
- **사용 부분과 방식**
  - 과제 PDF · 스타터 코드 · 강의록(1~10강)을 읽게 하고, 과제 요구사항과 강의록 구현 방식을 체크리스트로 정리하게 했다.
  - TODO 1~16의 코드와 지정 주석 3곳(`// [설명]`)을 작성하게 했다. 강의록에 나온 방법을 우선 쓰도록 지시했다. 강의록에 없는 부분은 단순한 방법만 쓰게 했다.
    - `errorHandler`의 `res.headersSent` 검사: Express 공식 문서 Error Handling 참고
    - `toLowerCase`를 이용한 대소문자 무시 검색
  - `npm run check`와 requests.http 1~19 자동 실행으로 기대 결과를 검증하게 했다. 경계값 점검, 추가 시나리오(20~26), 이 README 초안 작성도 맡겼다.
- **본인 확인**: (작성자가 직접 코드를 읽고 실행해 확인 · 이해한 내용을 적을 것)

## 5. 테스트 시나리오 설명

`requests.http`의 20~26번이다. `npm run reset` 후 1번부터 순서대로 실행하는 것을 기준으로 한다.

| 번호 | 요청 | 확인하는 규칙 | 기대 결과 |
|---|---|---|---|
| 20 | `GET /books/0` | id 경계값 — `validateId`는 1 이상의 정수만 통과 | 400 · `{ "message": "잘못된 id" }` |
| 21 | `POST /books` `{ title: "모순", author: "양귀자", status: "done", rating: 6 }` | 별점 범위 밖(최댓값 5 초과) | 400 · rating 범위 안내 메시지 |
| 22 | `POST /books` 같은 도서를 `rating: 5`로 | 별점 최댓값 5는 허용, 완독 도서만 별점 가능 | 201 · id 28 · status done · rating 5 |
| 23 | `PATCH /books/2` `{ rating: 1 }` | 별점 최솟값 1은 허용 (2번은 완독 도서) | 200 · rating 1 |
| 24 | `PATCH /books/2` `{ status: "reading", rating: 3 }` | 별점 규칙은 **수정 후 상태** 기준 — 완독에서 읽는 중으로 바뀌면 별점 불가 | 400 · 별점은 완독 도서만 가능 |
| 25 | `PATCH /books/2` `{ title: "제목 변경" }` | 수정 가능한 필드(status · rating · memo)가 하나도 없음 | 400 · 수정할 값 필요 안내 |
| 26 | `GET /books?keyword=code&keyword=java` | 같은 이름의 query가 배열로 도착하면 문자열이 아님 | 400 · keyword 형식 안내 |
