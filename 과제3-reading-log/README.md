# 과제 3 — 독서 기록 REST API 서버 (데이터베이스 연동)

- 이름: 김세창
- 학번: 60221303

과제 2 독서 기록 REST API 서버의 저장 위치를 JSON 파일에서 Supabase(PostgreSQL) 데이터베이스로 바꾸고, 독서 노트(1:N)와 태그(N:M) 기능을 Express 5 + TypeScript + Prisma로 구현했다.

## 1. 실행 방법

```bash
cp .env.example .env                 # DATABASE_URL에 과제용 Supabase Session pooler 연결 문자열 입력
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run reset
npm run check
npm run dev
```

## 2. 구조 · 동작 설명

**Q1.** `GET /books?status=done&tag=소설&keyword=김`에서 `bookStore.findAll`이 만드는 where 객체와 각 조건이 고르는 도서는? include의 `tags` · `_count`는 응답의 어느 값이 되는가?

`bookController.list`가 query를 검사해 `{ status: 'done', keyword: '김', tag: '소설' }`을 넘기면, `bookStore.findAll`이 빈 객체 `where`에 지정된 조건만 추가해 다음 객체를 만든다.

```ts
{
  status: 'done',
  OR: [
    { title:  { contains: '김', mode: 'insensitive' } },
    { author: { contains: '김', mode: 'insensitive' } },
  ],
  tags: { some: { name: '소설' } },
}
```

| 조건 | 고르는 도서 | 근거 코드 |
|---|---|---|
| `status: 'done'` | 읽기 상태가 완독인 도서 | `findAll`의 `if (options.status !== undefined) where.status = options.status` |
| `OR` + `contains` · `mode: 'insensitive'` | 제목 또는 저자에 '김'이 들어간 도서 (영문 대소문자 구분 없음) | `findAll`의 `where.OR = [{ title: … }, { author: … }]` |
| `tags: { some: { name: '소설' } }` | 연결된 태그 중 하나라도 이름이 '소설'인 도서 | `findAll`의 `where.tags = { some: { name: options.tag } }` |

where의 속성 세 개는 모두 만족해야 하므로(AND) `살인자의 기억법 · 우리가 빛의 속도로 갈 수 없다면 · 불편한 편의점` 3권이 id 오름차순(`orderBy: { id: 'asc' }`)으로 응답된다.

| include | 응답의 값 |
|---|---|
| `tags: true` | 도서마다 `"tags": [{ "id": 1, "name": "소설" }]` 배열 |
| `_count: { select: { notes: true } }` | 도서마다 `"_count": { "notes": 0 }` — 노트 내용 없이 노트 수만 |

**Q2.** 같은 제목 + 저자로 `POST /books`를 요청하면 409가 되는 과정은? 과제 2처럼 Store에서 먼저 조회하지 않아도 되는 이유는?

1. `schema.prisma` Book 모델의 `@@unique([title, author])`로 migrate dev가 `migration.sql`에 `CREATE UNIQUE INDEX "books_title_author_key" ON "books"("title", "author");`를 만든다.
2. `bookController.create`는 입력 검증만 하고 중복 검사 없이 `await store.create(input)`을 호출한다.
3. `bookStore.create`의 `prisma.book.create`가 INSERT를 보내면 데이터베이스가 고유 인덱스 위반으로 거부하고, Prisma가 code `P2002`인 `PrismaClientKnownRequestError`를 던진다. `bookStore.create`는 이 오류를 잡지 않는다.
4. Express 5는 async 핸들러에서 거부된 Promise를 에러 핸들러로 넘기므로, try/catch 없이 `app.ts` 맨 마지막의 `errorHandler`로 이동한다.
5. `errorHandlers.ts`에서 `err instanceof Prisma.PrismaClientKnownRequestError`이고 `err.code === 'P2002'`이면 `409 { message, code: 'P2002' }`로 응답한다(requests.http 16).

데이터베이스가 INSERT를 실행할 때 고유 제약을 직접 검사하므로 Store에서 먼저 조회할 필요가 없다. 과제 2의 `exists` → `create` 방식은 데이터 요청이 2번 필요하고, 두 요청이 동시에 `exists`를 통과하면 둘 다 저장될 수 있다. 고유 제약은 저장하는 순간에 검사하므로 이런 경우에도 중복을 막는다.

**Q3.** `DELETE /books/5`(노트 2개, 태그 '개발')에서 notes · _BookToTag의 행은 삭제되고 tags의 '개발'은 남는 이유는? Note의 onDelete를 생략하면?

| 테이블 | 결과 | 근거 코드 |
|---|---|---|
| notes | 도서 5의 노트 2개 삭제 | `schema.prisma` Note의 `@relation(fields: [bookId], references: [id], onDelete: Cascade)` → `migration.sql`의 `FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE` |
| _BookToTag | 도서 5의 연결 행 삭제 | 암시적 N:M(`tags Tag[]` · `books Book[]`)으로 migrate dev가 만든 `"_BookToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "books"("id") ON DELETE CASCADE` |
| tags | '개발' 행 유지 | tags 테이블에는 books를 가리키는 외래키가 없다. 외래키는 중간 테이블에만 있으므로 도서를 지워도 태그 행은 그대로이고, 다른 도서와의 연결도 유지된다(requests.http 30에서 개발 8) |

Note의 `onDelete`를 생략하면 필수 관계의 기본값인 Restrict가 되어 `migration.sql`에 `ON DELETE RESTRICT`가 생성된다. 노트가 있는 도서 5를 삭제하면 데이터베이스가 거부하고 Prisma가 `P2003`을 던진다. `bookStore.remove`는 `P2025`만 `false`로 바꾸고 그 밖의 오류는 다시 던지므로, `errorHandler`가 P2002가 아닌 Prisma 오류로 처리해 `500 {"message":"데이터베이스 요청 오류","code":"P2003"}`으로 응답하고 도서 5는 삭제되지 않는다. (onDelete를 뺀 복사본으로 직접 실행해 확인)

## 3. 오류 기록

### 오류 1

```
src/stores/bookStore.ts(8,23): error TS2305: Module '"../generated/prisma/client.js"' has no exported member 'Book'.
src/stores/bookStore.ts(29,17): error TS2339: Property 'book' does not exist on type 'PrismaClient<never, GlobalOmitConfig | undefined, DefaultArgs>'.
src/stores/noteStore.ts(6,15): error TS2305: Module '"../generated/prisma/client.js"' has no exported member 'Note'.
```

- 원인: `npm install` 직후, TODO 1(schema.prisma)을 작성하기 전에 `npm run check`를 실행했다. 모델이 없는 상태로 Client가 생성되어 `Book` · `Note` 타입과 `prisma.book`이 없었다.
- 해결: Book · Note · Tag 모델을 작성하고 `npx prisma migrate dev --name init` → `npx prisma generate`를 실행하자 오류가 사라졌다.

### 오류 2

```
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.chixzifpdbfiiqenelhn.supabase.co:5432"
Error: P1001: Can't reach database server at `db.chixzifpdbfiiqenelhn.supabase.co:5432`
```

- 원인: 과제용 Supabase DB에 `npm run reset`을 처음 실행했을 때, `DATABASE_URL`에 Session pooler가 아니라 Direct connection 연결 문자열(`db.<프로젝트ID>.supabase.co`)을 넣었다. Direct connection은 IPv6 네트워크가 필요해서(11강) DB 서버에 연결하지 못했다.
- 해결: Supabase Connect 화면에서 Connection Method를 Session pooler로 바꿔 연결 문자열(`postgres.<프로젝트ID>@aws-0-ap-northeast-2.pooler.supabase.com:5432`)을 다시 넣자 `Database reset successful`과 `초기 데이터 입력 완료: 도서 25권`이 출력됐다.

### 오류 3

```
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///…/exp/src/generated/prisma/client.js'
}

An error occurred while running the seed command:
Error: Command failed with exit code 1: tsx prisma/seed.ts
```

- 원인: Q3 확인용으로 onDelete를 뺀 복사본(`exp`)을 만들고 `migrate dev` 다음에 바로 `npx prisma db seed`를 실행했다. Prisma 7의 `migrate dev`는 Client를 생성하지 않으므로 `src/generated/prisma`가 없었고, `seed.ts` → `db.ts`의 `import … from './generated/prisma/client.js'`가 실패했다. (경로 일부는 `…`로 줄임)
- 해결: `npx prisma generate`를 실행한 뒤 다시 seed하자 `초기 데이터 입력 완료: 도서 25권`이 출력됐다. 과제 실행 순서가 migrate dev → generate → reset인 이유를 확인했다.

## 4. AI 활용 보고

Claude Code를 다음 부분에 사용했다.

1. 코드 구현: TODO 1~16과 지정 주석 3곳을 작성했다. 강의록에 없는 `res.headersSent` 검사는 과제 2와 같은 단순한 방법으로 사용했다.
2. 검증: `npm run check` 오류 0개를 확인했다. Claude 웹 컨테이너에서는 Supabase에 접속할 수 없어서, GitHub Actions에서 과제용 Supabase DB에 `npm run reset` 후 `requests.http` 1~38의 결과를 기대 결과와 비교했다(38개 일치). 과제 PDF의 규칙별 경계값 · 오류 응답과 onDelete를 뺀 경우의 500(P2003)도 따로 확인했다.
3. Supabase 연결: 과제용 프로젝트, Session pooler 연결 문자열, GitHub Secret 등록을 단계별로 안내받아 직접 설정했다. 연결 문자열과 비밀번호는 AI에 전달하지 않았다.
4. 추가 시나리오: `requests.http` 33~38번(경계값 · 규칙 위반)을 작성했다.
5. README: 초안 작성 후, 과제 2 README 형식에 맞춰 정리했다.
6. GitHub: 변경을 커밋 · 푸시하고 PR을 만들었다.

## 5. 테스트 시나리오 설명

`requests.http` 33~38번. `npm run reset` 후 1번부터 순서대로 실행한다.

| 번호 | 요청 | 확인하는 규칙 | 기대 결과 |
|---|---|---|---|
| 33 | `POST /books` 완독 · `rating: 6` | 별점 범위 밖 (1~5 정수만) | 400 |
| 34 | `POST /books` 완독 · `rating: 1` (33과 같은 제목 · 저자) | 별점 최솟값 허용, tags 생략 시 빈 배열 | 201 · status done · rating 1 · tags [] |
| 35 | `GET /books?keyword=%20%20` | 공백뿐인 keyword는 조건 없음 | 200 · 26권 |
| 36 | `GET /books?tag=sf` | 태그 이름은 전체 일치 (대소문자 구분) | 200 · 0권 |
| 37 | `POST /books` `tags: ["개발", "   "]` | 공백뿐인 태그 이름 | 400 |
| 38 | `DELETE /books/26/notes/0` | noteId 경계값 (1 이상의 정수만) | 400 |
