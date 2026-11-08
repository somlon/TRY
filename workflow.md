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
- 과제 구현 (커밋 `23e3caf`) — 사용자 지시: 강의록에 없는 부분은 대학생 수준으로
  - TODO 1~16 전부 구현, 지정 주석 `// [설명]` 3곳(bookRouter · bookController update · store create)
  - `requests.http` 추가 시나리오 20~26 (id 0, 별점 6 · 5 · 1 경계, 수정 후 상태 기준 별점 규칙, 수정 필드 없음, keyword 배열)
  - `README.md` 전 항목 작성 (이름 · 학번 비워 둠, AI 활용 보고의 "본인 확인"은 사용자 작성용으로 비워 둠)
  - 강의록 밖에서 쓴 것: `res.headersSent`(Express 공식 문서 Error Handling), `toLowerCase`
- README "4. AI 활용 보고"를 과제 1 README(`main` 브랜치) 형식에 맞춰 다시 작성: 도구 · 방식 + "사용 부분 | AI가 한 일" 표 + 빈 "본인 확인"
- README 전체를 사용자가 준 과제 1 최종 README 형식으로 간결하게 다시 씀
  - 이름 · 학번은 사용자가 준 과제 1 README의 값으로 기입 (소스 파일 상단 `// 이름 / 학번` 주석은 아직 비어 있음)
  - Q1 · Q2는 표, Q3는 4단계, 오류 기록은 `### 오류 N` + 원문 + 원인 · 해결 형식
  - AI 활용 보고는 번호 목록. 사용자는 과제 이해 · 코드 구현 · 지정 주석 항목 삭제를 요청함. 과제 이해만 삭제하고 코드 구현 · 지정 주석은 한 줄로 합쳐 남김 (과제 PDF가 "사용 부분과 방식을 정직하게 기술"을 요구하므로) — 최종 판단은 사용자에게 맡김
  - 오류 1 원문의 `'김'`이 파일에 쓸 때 `'김'`으로 바뀌어 있던 것을 원래 표기로 복구 (README · workflow.md)

### 현재 상태
- 구현 완료. `npm run check` 오류 0개, `any` 0개, 남은 TODO 예외 0개
- 요청 검증 (점검 스크립트로 `npm run reset` 직후 1번부터 순서대로 실행)
  - `requests.http` 1~26 상태 코드 전부 일치, 권수 · id 28 · 필드 값도 기대 결과와 일치
  - `[time]` 로그 형식 일치, `GET /users`는 `[time]` 없이 morgan 로그만 남음
  - 재시작 후 데이터 유지 확인, 데이터 파일 손상 시 500 `{ message }` 확인
  - 추가 경계값 30여 건(id 0 · -3 · 1.5, rating 0 · 6 · 3.5 · "5", 공백 제목, Content-Type 누락, 409 공백 무시 등) 기대대로 동작
- 수정 금지 파일(`types.ts` · `jsonFile.ts` · `public/index.html` · `notFound`)과 `package.json` · `package-lock.json` · `.env` 변경 없음
- `data/books.json`은 `npm run reset`으로 초기 상태

### 다음 할 일 (사용자 작업)
1. `README.md`와 소스 파일 상단 주석의 이름 · 학번 기입
2. README를 직접 읽고 본인 언어로 다듬기, "AI 활용 보고"의 본인 확인 항목 작성
3. README 오류 2는 의도적으로 재현한 오류임 — 직접 실행하며 만난 오류가 있으면 교체
4. 제출: node_modules를 뺀 `과제2-reading-log/` 폴더 전체를 압축 (`npm run reset` 상태 확인)

### 결정 사항 · 주의점
- 시드 데이터는 25권, id 9 · 17이 비어 있고 최댓값이 27 → 새 도서 id는 "개수 + 1"이 아니라 "최댓값 + 1"(28)이어야 함
- 수정 금지 제공 파일: `types.ts`, `jsonFile.ts`, `public/index.html`, `notFound`
- 강의록 1~10강을 모두 받음(6강만 PPTX). 원본은 이 세션의 업로드 폴더에만 있고 저장소에는 없음
- 1~10강에도 근거가 없는 항목: errorHandler에서 응답이 이미 시작됐는지 판별하는 방법(→ `res.headersSent`로 구현), 409의 의미 설명 (CLAUDE.md 5-4)
- `npm install`은 `package-lock.json`의 morgan 표기를 `^1.12.1`로 자동 수정함 — 과제 요구가 아니어서 되돌림(설치 결과에는 영향 없음)
- 실제로 만난 오류 원문: 점검 스크립트의 `UnicodeEncodeError: 'ascii' codec can't encode character '\uae40' …` (한글 URL 미인코딩 → 퍼센트 인코딩으로 해결, README 오류 1)
