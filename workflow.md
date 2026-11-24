# workflow.md — 세션 인계 기록

새 세션은 **맨 아래 항목의 "다음 할 일"** 부터 이어서 작업한다. 기록 규칙은 `CLAUDE.md` 규칙 2를 따른다.

항목 형식:

```
## 세션 N — YYYY-MM-DD
- 브랜치:
- 세션 ID:            (get_session으로 조회)
- 이전 세션 ID:       (있으면)
- 강의록 원본 보유:   (사용자에게서 원본을 받았으면 강의 번호, 없으면 "없음" — CLAUDE.md 규칙 7)
### 완료        (커밋 해시 포함)
### 현재 상태   (구현 · 검증 결과)
### 다음 할 일  (순서대로, 구체적으로)
### 결정 사항 · 주의점
### 만난 오류 원문 (README 오류 기록용 — 지어내지 않음)
```

---

## 세션 1 — 2026-11-24
- 브랜치: `claude/assignment3-reading-log` (`main`에서 시작, PR: https://github.com/somlon/TRY/pull/6)
- 세션 ID: `session_018FeffAoMqmaJtF2i1SYr1Q`
- 이전 세션 ID: 없음 (과제 3 첫 세션. 과제 2 세션은 `session_018Feff7zT1cbsrnHHtajF2b`)
- 강의록 원본 보유: `session_018FeffAoMqmaJtF2i1SYr1Q` (1~12강 전부, 해시가 `.claude/lectures.json`과 일치. 과제 3 PDF와 스타터 zip도 업로드 폴더에 있음)

### 완료
- 과제 3 스타터 zip을 `과제3-reading-log/`에 압축 해제해 커밋 (`3807e90`), PR 생성
- 과제 2 CLAUDE.md를 바탕으로 과제 3용 `CLAUDE.md` 작성 (규칙 1~7, 5-2 과제 3 체크리스트, 5-3에 11 · 12강 기준 추가)
  - 사용자 규칙 3개를 합침: 웹 컨테이너 작업(규칙 3), 압축 시 푸시 · workflow.md · 새 세션(규칙 2), 강의 밖 개념은 먼저 질문(규칙 5-1)
- `.claude/` 이식: settings.json(훅), compact-reminder.sh, lectures.sh, pptx_text.py. `lectures.json`에 11 · 12강 추가
- 컨테이너 개발 환경: 로컬 PostgreSQL 16 시작, DB `reading_log` 생성, `.env`(커밋 안 함) 작성, `npm install` 성공(package-lock 변경 없음)

- TODO 1 schema.prisma → `migrate dev --name init`(`prisma/migrations/20261124150759_init`) → generate → `db seed`
- TODO 2~16 구현, 지정 주석 3곳(bookStore.findAll · noteStore.create · noteStore.remove)

### 현재 상태
- `npm run check` 오류 0개, `any` 0개, 남은 TODO 예외 0개
- 빈 DB에 migrate + `db seed` 직후(= reset 직후와 같은 상태) requests.http 1~32 전부 기대 결과와 일치
  - 점검 스크립트: scratchpad의 `check_requests.py`(세션 전용, 저장소에 없음)
  - `[time]` 로그가 /books · /tags에 찍히고 /users에는 없음. 31(잘못된 JSON)은 app.ts의 express.json()이 Router보다 먼저라 로그 없음(정상)
  - 도서 5 삭제 후 notes · _BookToTag 행 0, 태그 '개발'은 남음
- Supabase는 컨테이너에서 접속 불가(외부 DNS 조회 실패, HTTPS 프록시만 허용) → 로컬 PostgreSQL로 개발 · 검증
- `npm run reset`은 아직 성공 확인 못 함: Prisma가 AI 에이전트 실행을 감지해 `migrate reset --force`를 막음.
  사용자의 명시적 동의 문장을 `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`에 넣어야 실행됨 → 사용자에게 동의 요청 중

### 다음 할 일
1. 사용자 동의를 받으면 로컬 DB에서 `npm run reset` 성공 확인 → requests.http 1~32 재확인
2. requests.http 추가 시나리오 3개 이상(경계값 · 규칙 위반) 작성 · 실행
3. README 전 항목 작성(실행 방법, Q1~Q3, 오류 기록 2건 이상, AI 활용 보고, 테스트 시나리오 표)
4. (사용자) 이름 · 학번 기입, 과제용 Supabase 프로젝트에서 최종 확인

### 결정 사항 · 주의점
- errorHandler의 `res.headersSent` 사용은 사용자가 과제 3에도 승인함(CLAUDE.md 5-4)
- `.env`는 커밋하지 않는다(과제 2와 다름 — Supabase 비밀번호 포함, 제출 시 감점)
- 강의록 원본 · 과제 PDF는 저장소에 올리지 않는다(저작권 문구, 사용자 지시)
- create의 status · memo 기본값은 `=== undefined`로만 적용(`??`를 쓰면 null이 기본값으로 바뀌어 400이 안 남). rating은 생략 · null 모두 null이므로 `??`
- Prisma의 AI 실행 차단(migrate reset)은 AI 도구 실행 환경 문제라 README 오류 기록에 쓰지 않는다(과제 PDF 오류 인정 범위)

### 만난 오류 원문
- 오류 A — TODO 1 작성 전 `npm run check` (npm install 직후, 모델 없는 Client 상태):
  ```
  src/stores/bookStore.ts(8,23): error TS2305: Module '"../generated/prisma/client.js"' has no exported member 'Book'.
  src/stores/bookStore.ts(29,17): error TS2339: Property 'book' does not exist on type 'PrismaClient<never, GlobalOmitConfig | undefined, DefaultArgs>'.
  src/stores/noteStore.ts(6,15): error TS2305: Module '"../generated/prisma/client.js"' has no exported member 'Note'.
  ```
  원인: schema.prisma에 모델이 없어 generate가 Book · Note 타입과 `prisma.book`을 만들지 않음.
