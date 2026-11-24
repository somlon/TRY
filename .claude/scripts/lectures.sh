#!/usr/bin/env bash
# 강의록 원본 확인 · 추출 도구 (CLAUDE.md 규칙 7)
#
# 강의록 원본은 저장소에 두지 않는다. 이 세션의 업로드 폴더에서
# .claude/lectures.json의 SHA-256과 일치하는 파일을 찾아 사용한다.
#
#   lectures.sh check          보유 · 누락 강의를 알려 준다 (SessionStart 훅이 호출)
#   lectures.sh path <번호>    해당 강의 원본 파일 경로를 출력한다
#   lectures.sh text <번호>... 해당 강의 원본의 텍스트를 추출한다 (세션 간 전달용)
#
# 업로드 폴더 위치는 LECTURE_UPLOADS_DIR로 바꿀 수 있다 (점검용).

set -u

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
MANIFEST="$ROOT/.claude/lectures.json"
UPLOADS="${LECTURE_UPLOADS_DIR:-${CLAUDE_CONFIG_DIR:-$HOME/.claude}/uploads}"
PPTX_SCRIPT="$ROOT/.claude/scripts/pptx_text.py"

if [ ! -f "$MANIFEST" ]; then
  echo "[강의록] 목록 파일이 없다: $MANIFEST"
  exit 0
fi

# 업로드 폴더의 파일을 "해시<TAB>경로" 목록으로 만든다
hash_index() {
  [ -d "$UPLOADS" ] || return 0
  find "$UPLOADS" -type f ! -name '.*' -print0 2>/dev/null |
    xargs -0 -r sha256sum 2>/dev/null |
    awk '{ h = $1; $1 = ""; sub(/^ +/, ""); print h "\t" $0 }'
}

# 강의 번호의 원본 경로를 출력한다 (없으면 빈 출력)
lecture_path() {
  local no="$1" sha
  sha="$(jq -r --arg no "$no" '.lectures[] | select(.no == $no) | .sha256' "$MANIFEST")"
  [ -n "$sha" ] || return 0
  hash_index | awk -F '\t' -v h="$sha" '$1 == h { print $2; exit }'
}

cmd_check() {
  local index total have=0 no title type held="" missing=""
  index="$(hash_index)"
  total="$(jq '.lectures | length' "$MANIFEST")"
  while IFS=$'\t' read -r no title type sha; do
    if printf '%s\n' "$index" | cut -f1 | grep -qx "$sha"; then
      have=$((have + 1)); held="$held $no"
    else
      missing="$missing"$'\n'"  - ${no}강 ${title} (${type})"
    fi
  done < <(jq -r '.lectures[] | [.no, .title, .type, .sha256] | @tsv' "$MANIFEST")

  echo "[강의록 확인] ${total}개 중 ${have}개 보유. 원본은 저장소에 없다 (CLAUDE.md 규칙 7)."
  [ -n "$held" ] && echo "  보유:$held"
  if [ -n "$missing" ]; then
    echo "  없음:$missing"
    echo "  → 규칙 7 순서대로 확보하라: ① 이전 세션에 [강의록 요청] 메시지 ② 응답이 없으면 사용자에게 업로드 요청"
  fi
}

cmd_path() {
  [ $# -ge 1 ] || { echo "사용법: lectures.sh path <번호>" >&2; return 2; }
  local p; p="$(lecture_path "$1")"
  [ -n "$p" ] && echo "$p" || { echo "${1}강 원본 없음" >&2; return 1; }
}

cmd_text() {
  [ $# -ge 1 ] || { echo "사용법: lectures.sh text <번호>..." >&2; return 2; }
  local no p title status=0
  for no in "$@"; do
    title="$(jq -r --arg no "$no" '.lectures[] | select(.no == $no) | .title' "$MANIFEST")"
    p="$(lecture_path "$no")"
    if [ -z "$p" ]; then
      echo "=== ${no}강 ${title}: 원본 없음"; status=1; continue
    fi
    echo "=== ${no}강 ${title}"
    case "$p" in
      *.pdf|*.PDF)
        if command -v pdftotext >/dev/null; then
          pdftotext "$p" - 2>/dev/null | sed -E 's/[ \t]+/ /g' | grep -v -E '^\s*$'
        else
          echo "(pdftotext 없음 — Read 도구로 $p 를 직접 읽을 것)"; status=1
        fi ;;
      *.pptx|*.PPTX)
        python3 -I "$PPTX_SCRIPT" "$p" || { echo "(PPTX 추출 실패 — python-pptx 설치 여부 확인)"; status=1; } ;;
      *) echo "(지원하지 않는 형식: $p)"; status=1 ;;
    esac
  done
  return $status
}

case "${1:-check}" in
  check) cmd_check ;;
  path)  shift; cmd_path "$@" ;;
  text)  shift; cmd_text "$@" ;;
  *) echo "사용법: lectures.sh [check | path <번호> | text <번호>...]" >&2; exit 2 ;;
esac
