# 과제 2 — 독서 기록 REST API 서버

- 이름: 김세창
- 학번: 60221303

도서 정보를 JSON 파일에 저장하고 조회 · 등록 · 수정 · 삭제 · 통계 기능을 제공하는 REST API 서버를 Express 5 + TypeScript로 구현했다.

## 1. 실행 방법

```bash
npm install
npm run check
npm run dev
npm run reset
```

## 2. 구조 · 동작 설명

**Q1.** `requestTimer`를 app.ts에 `app.use`로 장착한 경우와 bookRouter에 `router.use`로 장착한 경우, `GET /users` 요청의 콘솔 로그는 어떻게 달라지는가?

| 장착 위치 | `GET /users` 콘솔 로그 | 이유 |
|---|---|---|
| bookRouter `router.use(requestTimer)` (현재 코드) | `GET /users 404 0.412 ms - 31` (morgan만) | `app.use('/books', bookRouter)`로 장착했으므로 `/books`로 시작하는 요청만 bookRouter에 들어가고, `/users`는 bookRouter를 거치지 않고 `notFound`가 응답한다. |
| app.ts `app.use(requestTimer)` | 위 줄 + `[time] GET /users 404 3ms` | 경로 없는 `app.use`는 모든 요청에 실행되므로 `/users`도 requestTimer를 지난다. (직접 실행해 확인) |

**Q2.** `POST /books`의 400 · 409, `GET /books/:id`의 400 · 404는 어느 모듈에서 결정되는가? Store가 상태 코드를 정하지 않는 이유는?

| 요청 | 상태 코드 | 결정하는 곳 | 근거 코드 |
|---|---|---|---|
| `POST /books` | 400 | Controller `create` | 입력 검증 보조 함수(`toRequiredText` · `isRatingValue` · `isRatingAllowed`)가 실패하면 400 |
| `POST /books` | 400 (잘못된 JSON 본문) | 미들웨어 `errorHandler` | `err instanceof SyntaxError`이면 400 |
| `POST /books` | 409 | Controller `create` | `await store.exists(title, author)`가 `true`면 409 |
| `GET /books/:id` | 400 | 미들웨어 `validateId` | `Number.isInteger(id)`가 아니거나 `id < 1`이면 400, Controller는 실행되지 않음 |
| `GET /books/:id` | 404 | Controller `getById` | `store.findById`가 `undefined`면 404 |

Store는 데이터 · `undefined` · `boolean`만 반환하고, 이를 상태 코드로 바꾸는 일은 Controller가 맡는다. 역할을 나누면 Store는 데이터 처리만 하게 되고, 나중에 JSON 파일을 데이터베이스로 바꿔도 Store 함수의 이름과 반환값만 같으면 Controller를 고칠 필요가 없다.

**Q3.** `data/books.json`이 손상되면 try/catch가 없는데도 500 응답이 전송되는 과정은? (`jsonFile.ts`가 오류를 바꾸어 던지는 이유 포함)

1. `jsonFile.ts`의 `readJson`에서 `JSON.parse`가 `SyntaxError`를 던지고, `readJson`이 이를 `new Error('데이터 파일 형식 오류: …')`로 바꿔 다시 던진다.
2. `readJson` → `readBooks` → `store.findAll` → Controller `list`가 `await`로 연결되어 있어 오류가 Promise 거부로 `list`까지 전달된다.
3. Express 5는 async 핸들러의 거부된 Promise를 자동으로 에러 핸들러에 넘긴다. 그래서 try/catch 없이 `app.ts` 맨 마지막의 `errorHandler`로 이동한다.
4. `errorHandler`가 `console.error`로 기록하고, `SyntaxError`가 아니므로 `500 { message }`를 보낸다.

`errorHandler`는 `SyntaxError`를 클라이언트의 잘못된 JSON 본문(400)으로 판단한다. 데이터 파일의 `SyntaxError`를 그대로 던지면 서버 문제가 클라이언트 잘못(400)으로 분류되므로, `jsonFile.ts`가 일반 `Error`로 바꿔 500으로 처리되게 한다.

## 3. 오류 기록

### 오류 1

```
UnicodeEncodeError: 'ascii' codec can't encode character '\uae40' in position 31: ordinal not in range(128)
```

- 원인: requests.http를 자동 실행하는 점검용 스크립트로 3번 `GET /books?status=done&keyword=김`을 보낼 때, 한글 `김`을 퍼센트 인코딩하지 않아 요청 줄에 ASCII가 아닌 문자가 들어갔다.
- 해결: URL을 퍼센트 인코딩(`김` → `%EA%B9%80`)하도록 고치자 3번이 `200 · 3권`으로 응답했다. REST Client는 이 인코딩을 자동으로 한다.

### 오류 2

```
Error: 데이터 파일 형식 오류: data/books.json
    at readJson (/home/user/TRY/과제2-reading-log/src/jsonFile.ts:15:11)
```

- 원인: Q3 확인을 위해 `data/books.json`을 일부러 JSON이 아닌 내용으로 바꿨다. `JSON.parse`가 실패해 `500 {"message":"데이터 파일 형식 오류: data/books.json"}`이 응답됐다.
- 해결: `npm run reset`으로 `data/books.seed.json`을 복사해 복구하자 `GET /books`가 다시 200으로 응답했다.

## 4. AI 활용 보고

Claude Code를 다음 부분에 사용했다.

1. 코드 구현: TODO 1~16과 지정 주석 3곳을 작성했다. 강의록에 없는 `res.headersSent` 검사와 `toLowerCase`는 단순한 방법으로 사용했다.
2. 검증: `npm run check` 오류 0개를 확인하고, `npm run reset` 직후 `requests.http` 1~19의 결과를 기대 결과와 비교했다. `[time]` 로그 형식, 재시작 후 데이터 유지, 데이터 파일 손상 시 500, 경계값도 따로 확인했다.
3. 추가 시나리오: `requests.http` 20~26번(경계값 · 규칙 위반)을 작성했다.
4. README: 초안 작성 후, 요구 항목 중심으로 줄였다.
5. GitHub: 변경을 커밋 · 푸시했다.

## 5. 테스트 시나리오 설명

`requests.http` 20~26번. `npm run reset` 후 1번부터 순서대로 실행한다.

| 번호 | 요청 | 확인하는 규칙 | 기대 결과 |
|---|---|---|---|
| 20 | `GET /books/0` | id 경계값 (1 이상의 정수만 허용) | 400 |
| 21 | `POST /books` 완독 · `rating: 6` | 별점 범위 밖 | 400 |
| 22 | `POST /books` 완독 · `rating: 5` | 별점 최댓값 허용 | 201 · id 28 · rating 5 |
| 23 | `PATCH /books/2` `{ rating: 1 }` | 별점 최솟값 허용 (완독 도서) | 200 · rating 1 |
| 24 | `PATCH /books/2` `{ status: "reading", rating: 3 }` | 수정 후 상태가 완독이 아니면 별점 불가 | 400 |
| 25 | `PATCH /books/2` `{ title: "제목 변경" }` | 수정 가능한 필드(status · rating · memo) 없음 | 400 |
| 26 | `GET /books?keyword=code&keyword=java` | keyword가 배열로 도착하면 문자열이 아님 | 400 |
