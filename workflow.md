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
```

---

## 세션 1 — 2026-11-08
- 브랜치: `claude/epic-bardeen-9yrzon` (orphan, `main`과 히스토리를 공유하지 않음)
- 세션 ID: `session_018Feff7zT1cbsrnHHtajF2b`
- 이전 세션 ID: 없음 (첫 세션)
- 강의록 원본 보유: `session_018Feff7zT1cbsrnHHtajF2b` (1~10강 전부, 해시가 `.claude/lectures.json`과 일치)

### 완료
- 과제 2 원본 자료를 `과제2-자료/`에 업로드 (zip · PDF, SHA-256이 업로드 원본과 일치함을 확인)
- 스타터 zip을 `과제2-reading-log/`에 압축 해제해 커밋 (`.env`는 스타터 `.gitignore` 대상이라 강제 추가)
- `CLAUDE.md` 규칙 4개 작성: 하드코딩 금지 · 압축 시 인계 · 웹 컨테이너 작업 · 토큰 만료 시 자동 재개
- `.claude/settings.json`: SessionStart(`compact`) 알림 훅, `autoContinueAtUsageLimit: true`
- `CLAUDE.md` 규칙 5 추가: 과제 요구사항 체크리스트(5-2), 강의록 구현 기준(5-3), 자료에 근거가 없는 항목(5-4)
  - 근거: 과제 PDF 전체, 스타터 TODO 주석, 사용자가 이번 세션에 첨부한 강의록 5·7·8·9·10강
  - 강의록 PDF는 저장소에 올리지 않음(사용자 지시 대기)
- `CLAUDE.md` 규칙 6 추가: 한국어로 대화
- 강의록 1~4강(PDF) · 6강(PPTX)을 추가로 받아 규칙 5를 1~10강 기준으로 갱신 (5-3에 1·2·3·4·6강 기준 추가, 5-4 정리)
- `CLAUDE.md` 규칙 7 추가: 강의록 원본은 올리지 않고, 새 세션이 이전 세션에 요청(`[강의록 요청]` 메시지)하거나 사용자에게 업로드를 요청
  - `.claude/lectures.json`: 강의록 목록(번호 · 제목 · 형식 · 쪽수 · SHA-256). 업로드 파일에서 계산해 생성
  - `.claude/scripts/lectures.sh`: `check` · `path` · `text` / `.claude/scripts/pptx_text.py`: PPTX 텍스트 추출
  - `.claude/settings.json`: SessionStart(`startup|resume`) 훅이 `lectures.sh check` 실행
  - 점검: 보유 10/10 · 업로드 없음 0/10 · 강의 하나당 텍스트 최대 약 35KB(메시지 한도 64KB 이내)

### 현재 상태
- TODO 1~16은 모두 미구현 (스타터 그대로)
- `npm install`, `npm run check`는 아직 실행하지 않음

### 다음 할 일 (사용자가 구현을 지시하면)
0. 강의록 원본 확인(규칙 7) 후, CLAUDE.md 5-4의 남은 항목(errorHandler의 응답 시작 여부 판별 방법)을 사용자에게 확인
1. `cd 과제2-reading-log && npm install && npm run check`
2. TODO를 번호 순서대로 구현: app.ts(1) → validateId(2) → requestTimer(3) → errorHandler(4) → bookRouter(5) → store(6~11) → bookController(12~16)
3. 지정 `// [설명]` 주석 3곳 작성: `/stats` 선언 순서(bookRouter), 별점 규칙을 Controller에서 검사하는 이유(update), create의 await 저장 근거(store)
4. `npm run dev` 후 `requests.http` 1~19번을 curl로 확인, 추가 시나리오 3개 이상 작성
5. README.md 작성 (Q1~Q3, 오류 기록 2건, AI 활용 보고, 테스트 시나리오 표) — 이름 · 학번은 사용자가 기입
6. `npm run reset`으로 `data/books.json` 원복 후 커밋 · 푸시

### 결정 사항 · 주의점
- 시드 데이터는 25권, id 9 · 17이 비어 있고 최댓값이 27 → 새 도서 id는 "개수 + 1"이 아니라 "최댓값 + 1"(28)이어야 함
- 수정 금지 제공 파일: `types.ts`, `jsonFile.ts`, `public/index.html`, `notFound`
- 강의록 1~10강을 모두 받음(6강만 PPTX). 원본은 이 세션의 업로드 폴더에만 있고 저장소에는 없음
- 1~10강에도 근거가 없는 항목: errorHandler에서 응답이 이미 시작됐는지 판별하는 방법, 409의 의미 설명 (CLAUDE.md 5-4)
