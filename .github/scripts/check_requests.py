# 과제3-reading-log/requests.http 1~38을 순서대로 실행하고 기대 결과와 비교한다
# npm run reset 직후 상태에서 실행. 하나라도 다르면 종료 코드 1
# 사용: python3 -I check_requests.py [기본 주소, 기본값 http://localhost:3000]
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def call(method, path, body=None, raw=None, query=None):
    url = BASE + urllib.parse.quote(path)
    if query:
        url += "?" + urllib.parse.urlencode(query)
    data = None
    headers = {}
    if raw is not None:
        data = raw.encode()
        headers["Content-Type"] = "application/json"
    elif body is not None:
        data = json.dumps(body, ensure_ascii=False).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with opener.open(req) as r:
            text = r.read().decode()
            return r.status, (json.loads(text) if text else None)
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        return e.code, (json.loads(text) if text else None)


results = []


def check(no, label, status, expect_status, cond=True, detail=""):
    ok = status == expect_status and cond
    results.append(ok)
    print(f"{'OK ' if ok else 'NG '} {no:>2}. {label} → {status} (기대 {expect_status}) {detail}")


titles = lambda books: [b["title"] for b in books]

s, b = call("GET", "/books")
check(1, "전체 목록", s, 200, len(b) == 25 and all("tags" in x and "notes" in x["_count"] for x in b), f"{len(b)}권")
s, b = call("GET", "/books", query={"status": "want"})
check(2, "status=want", s, 200, len(b) == 9 and all(x["status"] == "want" for x in b), f"{len(b)}권")
s, b = call("GET", "/books", query={"status": "done", "keyword": "김"})
check(3, "done + 김", s, 200, titles(b) == ["살인자의 기억법", "우리가 빛의 속도로 갈 수 없다면", "불편한 편의점"], titles(b))
s, b = call("GET", "/books", query={"keyword": "code"})
check(4, "keyword=code", s, 200, titles(b) == ["Clean Code"], titles(b))
s, b = call("GET", "/books", query={"tag": "SF"})
check(5, "tag=SF", s, 200, titles(b) == ["작별인사", "우리가 빛의 속도로 갈 수 없다면", "지구 끝의 온실"], titles(b))
s, b = call("GET", "/books", query={"status": "want", "tag": "소설"})
check(6, "want + 소설", s, 200, titles(b) == ["흰", "지구 끝의 온실", "김약국의 딸들", "달러구트 꿈 백화점", "데미안"], titles(b))
s, b = call("GET", "/books", query={"status": "finish"})
check(7, "잘못된 status", s, 400, b and "message" in b, b)
s, b = call("GET", "/books/1")
check(8, "상세 1", s, 200, [n["page"] for n in b["notes"]] == [7, 134] and sorted(t["name"] for t in b["tags"]) == ["소설", "역사"],
      f"notes {[n['page'] for n in b['notes']]} tags {[t['name'] for t in b['tags']]}")
s, b = call("GET", "/books/abc")
check(9, "잘못된 id", s, 400, detail=b)
s, b = call("GET", "/books/99")
check(10, "없는 id", s, 404, detail=b)
s, b = call("GET", "/tags")
pairs = [(t["name"], t["_count"]["books"]) for t in b]
check(11, "태그 목록", s, 200, pairs == [("소설", 15), ("역사", 4), ("개발", 8), ("SF", 3), ("고전", 2), ("과학", 1)], pairs)

s, b = call("POST", "/books", {"title": "자바 ORM 표준 JPA 프로그래밍", "author": "김영한", "tags": ["개발", " 데이터베이스 ", "개발"]})
tg = [(t["id"], t["name"]) for t in b.get("tags", [])] if s == 201 else None
check(12, "태그 포함 등록", s, 201, s == 201 and b["id"] == 26 and b["status"] == "want" and b["rating"] is None and b["memo"] == "" and sorted(tg) == [(3, "개발"), (7, "데이터베이스")],
      f"id {b.get('id')} tags {tg}")
s, b = call("POST", "/books", {"title": "저자 없는 책"})
check(13, "필수값 누락", s, 400, detail=b)
s, b = call("POST", "/books", {"title": "새 책", "author": "홍길동", "rating": 4})
check(14, "미완독 별점", s, 400, detail=b)
s, b = call("POST", "/books", {"title": "새 책", "author": "홍길동", "tags": "개발"})
check(15, "tags 배열 아님", s, 400, detail=b)
s, b = call("POST", "/books", {"title": "소년이 온다", "author": "한강"})
check(16, "중복 도서", s, 409, detail=b)
s, b = call("PATCH", "/books/26", {"status": "done", "rating": 5})
check(17, "완독 + 별점", s, 200, b.get("status") == "done" and b.get("rating") == 5, f"{b.get('status')} {b.get('rating')}")
s, b = call("PATCH", "/books/3", {"rating": 4})
check(18, "읽는 중 별점", s, 400, detail=b)
s, b = call("PATCH", "/books/1", {"status": "reading"})
check(19, "완독 → 읽는 중", s, 200, b.get("status") == "reading" and b.get("rating") is None, f"{b.get('status')} {b.get('rating')}")
s, b = call("PATCH", "/books/99", {"memo": "없음"})
check(20, "없는 도서 수정", s, 404, detail=b)

s, b = call("POST", "/books/26/notes", {"page": 15, "content": "엔티티와 테이블의 매핑"})
check(21, "노트 등록", s, 201, b.get("id") == 7 and b.get("bookId") == 26, f"id {b.get('id')} bookId {b.get('bookId')}")
s, b = call("POST", "/books/26/notes", {"page": 0, "content": "잘못된 페이지"})
check(22, "page 0", s, 400, detail=b)
s, b = call("POST", "/books/99/notes", {"page": 1, "content": "도서 없음"})
check(23, "없는 도서 노트", s, 404, detail=b)
s, b = call("GET", "/books/26")
check(24, "상세 26", s, 200, len(b["notes"]) == 1 and sorted(t["name"] for t in b["tags"]) == ["개발", "데이터베이스"],
      f"notes {len(b['notes'])} tags {[t['name'] for t in b['tags']]}")
s, b = call("DELETE", "/books/1/notes/7")
check(25, "다른 도서 경로 노트 삭제", s, 404, detail=b)
s, b = call("DELETE", "/books/26/notes/7")
check(26, "노트 삭제", s, 204, b is None)
s, b = call("DELETE", "/books/26/notes/7")
check(27, "같은 노트 재삭제", s, 404, detail=b)

s, b = call("DELETE", "/books/5")
check(28, "도서 5 삭제", s, 204, b is None)
s, b = call("GET", "/books/5")
check(29, "삭제한 도서 조회", s, 404, detail=b)
s, b = call("GET", "/tags")
pairs = [(t["name"], t["_count"]["books"]) for t in b]
check(30, "태그 목록", s, 200, len(b) == 7 and dict(pairs)["개발"] == 8 and dict(pairs)["데이터베이스"] == 1, pairs)

s, b = call("POST", "/books", raw='{ "title": "따옴표 누락, }')
check(31, "잘못된 JSON", s, 400, detail=b)
s, b = call("GET", "/users")
check(32, "없는 경로", s, 404, detail=b)

# ── 추가 시나리오 ──
s, b = call("POST", "/books", {"title": "별점 범위 확인", "author": "테스트", "status": "done", "rating": 6})
check(33, "별점 6", s, 400, detail=b)
s, b = call("POST", "/books", {"title": "별점 범위 확인", "author": "테스트", "status": "done", "rating": 1})
check(34, "별점 1 완독 등록", s, 201, s == 201 and b["status"] == "done" and b["rating"] == 1 and b["tags"] == [],
      f"id {b.get('id')} status {b.get('status')} rating {b.get('rating')} tags {b.get('tags')}")
s, b = call("GET", "/books", query={"keyword": "  "})
check(35, "공백 keyword", s, 200, len(b) == 26, f"{len(b)}권")
s, b = call("GET", "/books", query={"tag": "sf"})
check(36, "tag=sf", s, 200, len(b) == 0, f"{len(b)}권")
s, b = call("POST", "/books", {"title": "빈 태그 확인", "author": "테스트", "tags": ["개발", "   "]})
check(37, "빈 태그 이름", s, 400, detail=b)
s, b = call("DELETE", "/books/26/notes/0")
check(38, "noteId 0", s, 400, detail=b)

print(f"\n일치 {sum(results)} / {len(results)}")
sys.exit(0 if all(results) else 1)
