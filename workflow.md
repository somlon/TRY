# workflow.md — 세션 인계 기록

새 세션은 **맨 아래 항목의 "다음 할 일"** 부터 이어서 작업한다. 기록 규칙은 `CLAUDE.md` 규칙 2를 따른다.

항목 형식:

```
## 세션 N — YYYY-MM-DD
- 브랜치:
### 완료        (커밋 해시 포함)
### 현재 상태   (구현 · 검증 결과)
### 다음 할 일  (순서대로, 구체적으로)
### 결정 사항 · 주의점
```

---

## 세션 1 — 2026-11-08
- 브랜치: `claude/epic-bardeen-9yrzon` (orphan, `main`과 히스토리를 공유하지 않음)

### 완료
- 과제 2 원본 자료를 `과제2-자료/`에 업로드 (zip · PDF, SHA-256이 업로드 원본과 일치함을 확인)
- 스타터 zip을 `과제2-reading-log/`에 압축 해제해 커밋 (`.env`는 스타터 `.gitignore` 대상이라 강제 추가)
- `CLAUDE.md` 규칙 4개 작성: 하드코딩 금지 · 압축 시 인계 · 웹 컨테이너 작업 · 토큰 만료 시 자동 재개
- `.claude/settings.json`: SessionStart(`compact`) 알림 훅, `autoContinueAtUsageLimit: true`
- `CLAUDE.md` 규칙 5 추가: 과제 요구사항 체크리스트(5-2), 강의록 구현 기준(5-3), 자료에 근거가 없는 항목(5-4)
  - 근거: 과제 PDF 전체, 스타터 TODO 주석, 사용자가 이번 세션에 첨부한 강의록 5·7·8·9·10강
  - 강의록 PDF는 저장소에 올리지 않음(사용자 지시 대기)

### 현재 상태
- TODO 1~16은 모두 미구현 (스타터 그대로)
- `npm install`, `npm run check`는 아직 실행하지 않음

### 다음 할 일 (사용자가 구현을 지시하면)
0. CLAUDE.md 5-4의 미확인 항목을 사용자에게 확인 (6강 강의록 등 추가 자료, 또는 출처를 밝힌 방법 승인)
1. `cd 과제2-reading-log && npm install && npm run check`
2. TODO를 번호 순서대로 구현: app.ts(1) → validateId(2) → requestTimer(3) → errorHandler(4) → bookRouter(5) → store(6~11) → bookController(12~16)
3. 지정 `// [설명]` 주석 3곳 작성: `/stats` 선언 순서(bookRouter), 별점 규칙을 Controller에서 검사하는 이유(update), create의 await 저장 근거(store)
4. `npm run dev` 후 `requests.http` 1~19번을 curl로 확인, 추가 시나리오 3개 이상 작성
5. README.md 작성 (Q1~Q3, 오류 기록 2건, AI 활용 보고, 테스트 시나리오 표) — 이름 · 학번은 사용자가 기입
6. `npm run reset`으로 `data/books.json` 원복 후 커밋 · 푸시

### 결정 사항 · 주의점
- 시드 데이터는 25권, id 9 · 17이 비어 있고 최댓값이 27 → 새 도서 id는 "개수 + 1"이 아니라 "최댓값 + 1"(28)이어야 함
- 수정 금지 제공 파일: `types.ts`, `jsonFile.ts`, `public/index.html`, `notFound`
- 첨부된 강의록은 5·7·8·9·10강. 6강(기본 HTTP 서버와 REST API, 5강 · 7강에서 언급)과 1~4강(TypeScript 기초)은 받지 못함
