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
