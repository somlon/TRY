# CLAUDE.md — 작업 규칙

이 브랜치는 `main`(과제 1)과 히스토리를 공유하지 않는 **독립(orphan) 브랜치**이며, 과제 2(독서 기록 REST API 서버) 전용이다.
아래 규칙은 이 브랜치에서 일하는 모든 Claude 세션에 적용된다. 작업을 시작하기 전에 `workflow.md`를 먼저 읽는다.

## 저장소 구성

| 경로 | 내용 |
|---|---|
| `과제2-reading-log/` | 스타터 프로젝트(압축 해제본). 실제 구현은 여기서 한다 |
| `과제2-자료/` | 원본 zip · 과제 PDF. 참고용이며 수정하지 않는다 |
| `workflow.md` | 세션 간 작업 인계 기록 (규칙 2) |
| `.claude/settings.json` | 압축 알림 훅(규칙 2) · 사용량 한도 자동 재개(규칙 4) |

- 수정 금지 제공 파일: `src/types.ts`, `src/jsonFile.ts`, `public/index.html`, `src/middlewares/errorHandlers.ts`의 `notFound` (과제 PDF 8쪽).
- `.env`는 스타터의 `.gitignore` 대상이지만 `npm run dev`가 `--env-file=.env`로 읽으므로 저장소에 포함해 두었다(비밀값 없음). 지우지 않는다.

---

## 규칙 1. 하드코딩 금지 (반드시)

값은 직접 써 넣지 말고, 그 값이 나오는 곳에서 가져온다.

- **환경값**: 포트 · 데이터 파일 경로는 `.env` → `process.env`로 읽는다. 코드에 포트 번호나 `data/books.json` 경로를 새로 적지 않는다.
- **도메인 규칙**: 허용 상태값은 `types.ts`의 `ReadingStatus` · `isReadingStatus`로 검사한다. `'want' | 'reading' | 'done'` 목록을 여러 파일에 복사하지 않는다.
- **규칙 상수**: 별점 범위(최솟값 · 최댓값)처럼 여러 곳에서 쓰는 값은 이름 있는 상수 하나로 정의해 재사용한다.
- **계산값**: id(기존 최댓값 + 1), 통계(want · reading · done · total), `createdAt`은 항상 데이터와 현재 시각에서 계산한다. 기대 결과 숫자(예: 전체 권수, 다음 id, 상태별 권수)를 코드에 넣지 않는다.
- **테스트 맞추기 금지**: `requests.http`의 특정 입력을 조건문으로 따로 처리해 기대 결과를 맞추지 않는다. 규칙을 일반적으로 구현해서 결과가 나오게 한다.
- **경로**: 파일 경로는 `import.meta.url` · `path.join` 기준의 상대 경로로 만든다. 컨테이너 절대경로(`/home/...`)를 쓰지 않는다.
- **반복 검증**: 같은 검증이 두 번 이상 나오면 `bookController.ts`의 보조 함수 영역에 함수로 분리한다.
- **운영 정보**: 브랜치명 · 저장소 주소 · 세션 ID를 스크립트나 규칙에 고정하지 않고 실행 시점에 조회한다
  (`git branch --show-current`, `git remote get-url origin`).
- **모르는 값**: 이름 · 학번 등 사용자만 아는 값은 지어내서 채우지 않는다. 비워 두고 사용자에게 알린다.

## 규칙 2. 세션 압축 시 `workflow.md` 기록 후 새 세션에서 이어서 작업

**발동 조건**: 컨텍스트 압축(자동 · 수동)이 일어났음을 알게 된 즉시.
`.claude/settings.json`의 SessionStart(`compact`) 훅이 압축 직후 알림을 넣어 준다. 알림이 없더라도 대화가 이전 대화의 요약으로 시작하면 압축된 것으로 본다.

1. **`workflow.md` 갱신** — 맨 아래에 이번 세션 항목을 추가한다(형식은 `workflow.md` 상단 참고).
   완료한 작업(커밋 해시 포함) · 현재 상태 · 검증 결과(`npm run check`, 요청 테스트) · 다음 할 일(구체적으로, 순서대로) · 결정 사항과 주의점을 적는다.
2. **커밋 · 푸시** — 작업 중인 변경과 `workflow.md`를 커밋하고 `git push -u origin "$(git branch --show-current)"`. 실패하면 규칙 4를 따른다.
3. **새 세션 생성** — `mcp__claude-code-remote__create_session`을 호출한다.
   - `source_url`: `git remote get-url origin` 결과
   - `source_revision`, `outcome_branch`: 현재 브랜치
   - `title`: 작업 내용을 알 수 있는 이름
   - `prompt`: "CLAUDE.md와 workflow.md를 읽고, workflow.md 마지막 항목의 '다음 할 일'부터 이어서 작업하라."
4. **이 세션 종료** — 새 작업을 시작하지 않는다. 새 세션 ID와 이어갈 작업을 사용자에게 알리고 멈춘다.

압축에 대비해, 큰 단계(TODO 묶음, README 항목 등)를 끝낼 때마다 `workflow.md`를 갱신하고 푸시해 둔다.

## 규칙 3. Claude 웹 컨테이너 서버에서 작업

- 설치 · 타입 검사 · 서버 실행 · 요청 테스트는 모두 이 클라우드 컨테이너에서 한다. 사용자 PC 폴더 연결(`request_computer_folder`)은 쓰지 않는다.
- 기본 순서 (`과제2-reading-log/`에서):
  ```bash
  npm install
  npm run check     # 타입 오류 0개 확인
  npm run dev       # 백그라운드로 실행, 포트는 .env의 PORT
  ```
  요청 테스트는 `requests.http`의 시나리오를 `curl`로 재현해 기대 결과와 비교한다.
- 컨테이너는 일시적이다. 결과물은 반드시 커밋 · 푸시한다. `node_modules`, `dist`는 커밋하지 않는다.
- 테스트로 바뀐 `data/books.json`은 커밋 전에 `npm run reset`으로 초기 데이터로 되돌린다.
- 사용자 지시 없이 이 저장소 외의 외부 서비스에 파일을 올리지 않는다.

## 규칙 4. 토큰 만료 시 초기화 후 자동으로 이어서 작업

| 상황 | 처리 |
|---|---|
| **사용량 한도**(usage limit) 도달 | `.claude/settings.json`의 `autoContinueAtUsageLimit: true`로 한도가 초기화되면 자동 재개한다. 재개되면 사용자에게 다시 묻지 않고 `git status` · `git log` · `workflow.md`로 상태를 확인한 뒤 멈춘 지점부터 이어 간다. |
| **컨텍스트 토큰** 소진 | 자동 압축이 일어나므로 규칙 2를 따른다. |
| **인증 토큰**(git push · GitHub API의 401/403, 인증 오류) | ① 네트워크 오류는 2 · 4 · 8 · 16초 간격으로 최대 4번 재시도한다. ② 인증 오류면 `curl -sS "$HTTPS_PROXY/__agentproxy/status"`로 프록시 상태를 확인한다. 자격 증명은 프록시가 관리하므로 토큰을 직접 만들거나 파일 · 코드에 넣지 않는다. ③ 그래도 실패하면 `read_documentation`(`github.access`)으로 재연결 방법을 사용자에게 안내한다. 기다리는 동안 로컬 커밋으로 작업을 계속하고, 연결이 복구되면 push부터 다시 해서 이어 간다. |

어느 경우든 진행 상황은 `workflow.md`와 커밋에 남아 있어야 한다. 그래야 재개한 세션이 손실 없이 이어 갈 수 있다.

## 규칙 5. 과제 요구사항과 강의록 기준을 반드시 만족

구현은 아래 5-2 체크리스트를 **전부** 만족하고 5-3 기준을 따라야 완료로 본다. 하나라도 확인하지 못했으면 완료라고 보고하지 않는다.

### 5-1. 근거 자료와 우선순위

1. **과제 자료(최우선)** — `과제2-자료/과제2-독서기록-REST-API-서버.pdf`와 스타터의 TODO 주석 · `README.md` · `requests.http`. 5-2는 이 자료를 옮긴 것이다.
2. **강의록** — 5강(Node 프로젝트 관리와 내장 기능) · 7강(Express 시작) · 8강(미들웨어와 에러 처리) · 9강(Router · Controller 분리) · 10강(쿠키와 세션). 강의록 PDF는 저장소에 없으므로 5-3의 요약을 기준으로 삼는다.
3. **둘이 다르면 과제를 따른다.** 예: 9강의 메모리 배열 · 동기 Store → 과제는 파일 기반 async Store / 9강의 Controller 안 `parseId` → 과제는 `validateId` 미들웨어 / 8강의 전역 처리 시간 미들웨어 → 과제는 bookRouter에만 장착 / 8강의 `express.urlencoded` → 과제 app.ts에는 넣지 않음.
4. **두 자료 어디에도 근거가 없는 방법은 임의로 쓰지 않는다.** 사용자에게 상황을 설명하고 출처(공식 문서 주소 등)를 밝혀 확인받은 뒤 사용한다. 알려진 항목은 5-4에 있다.
5. **과제에 없는 것은 추가하지 않는다.** 기능 · 동작 · 의존성 모두 해당한다. 예: 10강의 cookie-parser · express-session · config.ts, memo 공백 제거, 대소문자를 무시하는 중복 검사, 새 npm 패키지. 제공된 함수 이름 · export · 시그니처도 바꾸지 않는다.

### 5-2. 과제 요구사항 체크리스트

**구조 · 공통**
- [ ] 역할 분리: app.ts는 공통 미들웨어 · Router 장착 · 404 · 에러 처리만 하고 요청 처리 코드는 두지 않는다. import 방향은 app → routes → controllers → store 한 방향이다.
- [ ] 상태 코드는 미들웨어와 Controller만 정한다. Store는 데이터 · `undefined` · `boolean`만 반환한다.
- [ ] 모든 오류 응답은 `{ message }` JSON이다.
- [ ] 데이터는 `DATA_FILE`(data/books.json)에 비동기로 읽고 쓴다. 서버를 재시작해도 유지된다.
- [ ] 수정 금지 파일과 제공 예시(`store.findById`, `bookController.getById`)는 그대로 둔다.

**도서 필드**
- `id`: 서버가 부여한다.
- `title` · `author`
- `status`: `want` · `reading` · `done` 중 하나다.
- `rating`: 1~5 정수 또는 `null`이다. 완독 도서만 별점을 가질 수 있다.
- `memo`
- `createdAt`: 서버가 ISO 문자열로 기록한다.

**TODO 1 — app.ts**
- [ ] 등록 순서: `morgan('dev')` → `express.static`(src 상위 폴더의 public) → `express.json()` → `app.use('/books', bookRouter)` → `notFound` → `errorHandler`

**TODO 2 — validateId**
- [ ] `:id`가 1 이상의 정수가 아니면 400 + `{ message }`로 응답하고 끝낸다. 예: `abc` · `0` · `-3` · `1.5` → 400.
- [ ] 올바르면 `next()`로 넘긴다.
- [ ] `:id`가 있는 endpoint 3개에 장착한다.

**TODO 3 — requestTimer**
- [ ] 응답 전송이 끝나면 `[time] 메서드 전체경로 상태코드 처리시간ms` 한 줄을 출력한다. 예: `[time] GET /books?keyword=code 200 3ms`, `[time] PATCH /books/3 400 1ms`.
- [ ] 전체경로는 장착 경로(/books)와 query string을 포함한 원래 요청 URL이다.
- [ ] bookRouter 전체에 장착한다. 그래서 `/books`로 시작하지 않는 요청(GET /users 등)은 기록하지 않는다.

**TODO 4 — errorHandler**
- [ ] 응답 전송이 이미 시작됐으면 Express 기본 처리기에 넘긴다.
- [ ] 서버 콘솔에 오류를 기록한다.
- [ ] 잘못된 JSON 본문 오류는 400, 그 밖의 오류는 500으로 응답한다.
- [ ] 응답은 `{ message }` 형식이다.

**TODO 5 — bookRouter**
- [ ] `requestTimer`는 Router 전체에 적용한다.
- [ ] endpoint 6개를 연결한다: `GET /`→list, `GET /stats`→stats, `GET /:id`→getById, `POST /`→create, `PATCH /:id`→update, `DELETE /:id`→remove.
- [ ] `:id` endpoint에는 `validateId`를 붙인다.
- [ ] `/stats`를 `/:id`보다 먼저 선언한다.

**TODO 6~11 — store** (모든 함수는 파일을 읽고, 바꿨으면 다시 저장한다)
- [ ] `findAll`
  - status가 있으면 그 상태만 남긴다.
  - keyword가 있으면 제목 또는 저자에 포함된 것만 남긴다(영문 대소문자 무시).
  - 둘 다 오면 두 조건을 모두 만족해야 한다.
  - 조건이 없으면 전체를 반환한다. 순서는 파일 순서 그대로다.
- [ ] `exists`: 제목과 저자가 모두 같은 도서가 있으면 true다.
- [ ] `create`
  - id는 기존 최댓값 + 1이다(도서가 없으면 1).
  - `createdAt`은 `new Date().toISOString()`이다.
  - 파일 저장을 await로 기다린 뒤 저장한 도서를 반환한다.
- [ ] `update`
  - 대상이 없으면 undefined를 반환한다.
  - 전달된 필드만 바꾼다.
  - done에서 다른 상태로 바뀌면 rating을 null로 만든다.
- [ ] `remove`: 삭제했으면 true, 대상이 없으면 false다.
- [ ] `countByStatus`: want · reading · done 수와 total을 반환한다.

**TODO 12~16 — bookController**
- [ ] list `GET /books`
  - status가 허용 값이 아니면 400이다. 생략하면 조건 없음이다.
  - keyword가 문자열이 아니면(배열 등) 400이다.
  - keyword는 앞뒤 공백을 지운 뒤 빈 문자열이면 조건 없음이다.
  - 성공하면 200 + 배열이다. 결과가 없으면 빈 배열이다.
- [ ] create `POST /books`
  - 본문이 없을 수 있으므로 `req.body?.`로 접근한다.
  - title · author: 필수 문자열이다. 앞뒤 공백을 지운 뒤 비면 400이고, 저장도 공백을 지운 값으로 한다.
  - status: 생략하면 `'want'`이고, 허용 값이 아니면 400이다.
  - memo: 생략하면 `''`이고, 문자열이 아니면 400이다.
  - rating: 생략하거나 null이면 null이다. 1~5 정수가 아니면 400이다. status가 `'done'`이 아닌데 별점이 있으면 400이다.
  - 입력 검증을 통과한 뒤 같은 제목 + 저자가 이미 있으면 409다.
  - 성공하면 201 + 저장된 도서다.
- [ ] update `PATCH /books/:id` (아래 순서대로 검사한다)
  - ① status · rating · memo가 하나도 없으면 400이다.
  - ② 형식이 틀리면 400이다. status는 허용 값, rating은 1~5 정수 또는 null, memo는 문자열이어야 한다.
  - ③ 대상 도서가 없으면 404다.
  - ④ 수정 후 상태가 `'done'`이 아닌데 rating(null 제외)을 보내면 400이다.
  - ⑤ 성공하면 200 + 수정된 도서다.
- [ ] remove `DELETE /books/:id`: 성공하면 204(본문 없음), 대상이 없으면 404다.
- [ ] stats `GET /books/stats`: 200 + `{ want, reading, done, total }`이다.
- [ ] 그 외 경로는 notFound가 404로 응답한다.
- [ ] 반복되는 검증은 보조 함수 영역에 둔다. 보조 함수는 export하지 않는다.

**지정 주석 `// [설명]` 3곳** (각각 한 줄)
- [ ] bookRouter: `/stats`를 `/:id`보다 먼저 선언해야 하는 이유
- [ ] bookController update: 별점 규칙을 Store가 아닌 Controller에서 검사하는 이유
- [ ] store create: 파일 저장을 await로 기다린 뒤 반환하는 이유

**검증 · 제출물**
- [ ] `npm run check` 오류가 0개다.
- [ ] `npm run reset` 직후 `requests.http` 1~19를 순서대로 실행한 결과가 기대 결과(상태 코드 · 권수 · id · 필드 값)와 일치한다.
- [ ] 콘솔의 `[time]` 로그 형식이 위와 같다.
- [ ] 재시작 후에도 데이터가 유지된다.
- [ ] `requests.http` "추가 시나리오"
  - 제공되지 않은 요청을 3개 이상 작성한다.
  - `### 번호. 확인 내용 → 기대 결과` 형식을 쓴다.
  - 경계값(최솟값 · 최댓값 · 범위 밖 값)이나 규칙 위반 요청을 포함한다.
  - README 5번 표와 내용을 일치시킨다.
- [ ] README.md 모든 항목
  - 실행 방법
  - Q1~Q3: 근거가 되는 파일과 코드를 명시한다.
  - 오류 기록 2건 이상: 실제로 만난 오류 메시지 원문과 해결 과정이다. 지어내지 않고, 오류를 만날 때마다 workflow.md에 원문을 기록해 둔다.
  - AI 활용 보고: Claude가 작성한 부분과 방식을 사실대로 적는다.
  - 테스트 시나리오 표
  - 이름 · 학번은 사용자가 기입한다.
- [ ] 제출 전에 `npm run reset`을 실행한다. 제출물은 node_modules를 뺀 프로젝트 폴더 전체다.

### 5-3. 강의록 구현 기준

**5강 — Node 프로젝트 관리와 내장 기능**
- ESM `import`/`export`를 쓴다.
- 내장 모듈은 `node:` 접두어로 가져온다.
- `__dirname`은 `import.meta.url` + `fileURLToPath`로 만든다.
- 경로는 문자열 덧셈 대신 `path.join`으로 만든다.
- 파일 입출력은 `fs/promises` + async/await로 한다. 동기 API(`readFileSync` 등)는 쓰지 않는다.
- `process.env` 값은 문자열이므로 `Number()`로 바꾼다.

**7강 — Express 시작**
- Express 5 문법만 쓴다. `require`, `app.get('*')`, `bodyParser` 같은 Express 4 문법은 쓰지 않는다.
- 타입만 가져올 때는 `import type`을 쓴다.
- 분리한 핸들러는 `RequestHandler` / `ErrorRequestHandler`로 타입을 지정한다. 암묵적 any를 남기지 않고 `any`도 쓰지 않는다.
- Request 제네릭 순서는 `<Params, ResBody, ReqBody, ReqQuery>`다.
- 한 요청에 응답은 한 번만 보낸다. 응답한 분기는 바로 `return`한다.
- 응답은 `res.status().json()` 패턴으로 보낸다. 기본 200, 생성 201, 본문 없는 삭제는 `sendStatus(204)`다.
- 400(형식 오류)과 404(자원 없음)를 구분한다.
- URL에서 온 값은 문자열이다. `Number()`로 바꾸고 `Number.isInteger`로 검증한다.
- query는 배열로 도착할 수 있다.
- `req.body`는 undefined일 수 있다.
- TypeScript 타입은 런타임 검증이 아니므로 `unknown` 값은 직접 검사한다.
- 고정 경로를 매개변수 경로보다 먼저 선언한다.

**8강 — 미들웨어와 에러 처리**
- 등록 순서가 실행 순서다.
- 미들웨어는 `next()` 호출과 응답 중 하나를 반드시 한다.
- 처리 시간은 `res.on('finish')` 리스너를 `next()` 전에 등록해서 잰다.
- route-level 미들웨어는 나열해서 붙인다. 예: `router.get('/:id', validateId, book.getById)`.
- 에러 핸들러는 인자 4개를 모두 선언하고, `err`는 `instanceof Error`로 좁혀서 쓴다.
- Express 5는 async 핸들러의 reject를 에러 핸들러로 자동 전달한다. 따라서 Controller에 try/catch를 두지 않는다.
- `next(err)`는 `return`과 함께 쓴다.

**9강 — Router · Controller 분리**
- 폴더는 `routes/` · `controllers/` · `middlewares/`로 나누고, 파일 이름은 자원 + 역할로 짓는다.
- 상대 import에는 `.js` 확장자를 붙인다.
- Router 내부 경로는 `'/'` · `'/:id'`로 쓴다. mount path를 반복하지 않는다.
- `export default router`, `import * as book` 형태를 쓴다.
- Controller 파일 순서는 import → 타입 → 보조 함수(export 없음) → export 함수다.
- 보조 함수는 실패를 null 등으로 돌려주고, 응답은 Controller가 정한다.
- Store 내부 데이터와 보조 함수는 export하지 않는다.
- 로그에는 `req.originalUrl`을 쓴다.
- `router.use`는 그 Router로 들어온 요청에만 적용된다.
- PATCH는 undefined가 아닌 필드만 반영한다.
- 목록이 비어도 404가 아니라 빈 배열로 응답한다.

**10강 — 쿠키와 세션**
- 과제 2 요구사항이 아니므로 적용하지 않는다.

### 5-4. 자료에 근거가 없는 항목 (구현 전에 사용자 확인)

사용자가 강의록을 추가로 주거나 사용할 방법을 승인하면 이 표를 갱신하고 그대로 따른다.

| 항목 | 상황 |
|---|---|
| errorHandler: 응답 전송이 이미 시작됐는지 판별하는 방법 | 첨부 강의록(5·7·8·9·10강)에 없음 |
| errorHandler: 잘못된 JSON 본문 오류를 구분하는 방법 | 강의록에 없음. `jsonFile.ts` 주석(JSON.parse의 SyntaxError를 일반 Error로 바꿔 400으로 분류되지 않게 함)이 구분 기준을 암시함 |
| 409 Conflict | 과제 PDF가 상태 코드를 지정하므로 구현은 가능. 의미 설명은 강의록에 없음(7강은 201·204·400·404·500만 소개) |
| `unknown` 값 좁히기(`typeof` 등) · `trim` · `toLowerCase` · 배열 최댓값 같은 기초 문법 | 첨부 강의록에 예시가 없음. 1~4강(TypeScript 기초) 범위로 추정 |
| requestTimer에서 상태 코드 읽기 | 강의록에는 `res.statusCode`를 설정하는 예(7강 http 모듈)만 있음 |

## 규칙 6. 한국어로 대화

- 사용자에게 보내는 모든 채팅 응답은 한국어로 작성한다. 진행 상황 안내, 질문, 최종 보고 모두 해당한다.
- 코드 · 명령어 · 파일 경로 · 식별자 · 오류 메시지 원문은 원래 표기를 그대로 쓰고, 설명은 한국어로 붙인다.
