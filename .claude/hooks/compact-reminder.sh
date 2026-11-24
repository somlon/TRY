#!/usr/bin/env bash
# SessionStart(compact) 훅 — 컨텍스트 압축 직후 CLAUDE.md 규칙 2(세션 인계)를 Claude에게 상기시킨다.
# 브랜치·원격 주소는 실행 시점에 git에서 조회한다 (하드코딩 금지).

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0

branch="$(git branch --show-current 2>/dev/null)"
remote="$(git remote get-url origin 2>/dev/null)"

msg="[자동 알림] 컨텍스트가 압축되었다. CLAUDE.md 규칙 2(세션 압축 시 인계)를 지금 수행하라:
1) workflow.md에 이번 세션의 작업 내역·현재 상태·다음 할 일을 기록
2) 커밋 후 현재 브랜치(${branch:-git branch --show-current로 확인})에 push
3) create_session으로 새 세션을 열어(source_url=${remote:-git remote get-url origin}, 같은 브랜치) workflow.md의 다음 할 일부터 이어서 작업하게 함
4) 이 세션에서는 새 작업을 시작하지 말고, 새 세션 정보를 사용자에게 알린 뒤 종료"

jq -n --arg ctx "$msg" \
  '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}'
