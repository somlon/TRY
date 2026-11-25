# 과제 3 PDF 요구사항 점검 — requests.http에 없는 경우까지 API로 확인한다
# npm run reset 직후(초기 데이터: 도서 25 · 태그 6 · 노트 6) 상태에서 실행. 하나라도 다르면 종료 코드 1
# 사용: python3 -I audit_pdf.py [기본 주소, 기본값 http://localhost:3000]
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
results = []
section = ""


def call(method, path, body=None, raw=None, query=None, json_header=True):
    url = BASE + urllib.parse.quote(path)
    if query is not None:
        url += "?" + urllib.parse.urlencode(query, doseq=True)
    data, headers = None, {}
    if raw is not None:
        data = raw.encode()
    elif body is not None:
        data = json.dumps(body, ensure_ascii=False).encode()
    if data is not None and json_header:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with opener.open(req) as r:
            text = r.read().decode()
            return r.status, (json.loads(text) if text else None), text
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        try:
            parsed = json.loads(text) if text else None
        except json.JSONDecodeError:
            parsed = None
        return e.code, parsed, text


def sec(name):
    global section
    section = name
    print(f"\n── {name}")


def check(label, cond, detail=""):
    results.append(bool(cond))
    print(f"{'OK ' if cond else 'NG '} {label}" + (f"  — {detail}" if detail else ""))


def expect(label, resp, status, cond=True, show=None):
    s, b, _ = resp
    ok = s == status and bool(cond)
    detail = f"{s}" + (f" {show}" if show is not None else (f" {b}" if s >= 400 else ""))
    check(f"{label} → 기대 {status}", ok, detail)
    return b


def is_message_only(b):
    return isinstance(b, dict) and set(b) == {"message"} and isinstance(b["message"], str)


ids = lambda books: [x["id"] for x in books]
names = lambda tags: sorted(t["name"] for t in tags)

# ───────────────────────────────────────────────────────────── 목록 조회
sec("GET /books 목록 조회 (PDF 7 · 8쪽)")
s, b, _ = call("GET", "/books")
check("조건 없음 → 200 · 25권", s == 200 and len(b) == 25, f"{s} {len(b)}권")
check("id 오름차순", ids(b) == sorted(ids(b)) and ids(b) == list(range(1, 26)))
check("도서마다 tags 배열 · _count.notes 포함", all(isinstance(x.get("tags"), list) and isinstance(x.get("_count", {}).get("notes"), int) for x in b))
check("목록에는 notes 배열이 없음 (노트 수만)", all("notes" not in x for x in b))
check("도서 필드 id · title · author · status · rating · memo · createdAt",
      all({"id", "title", "author", "status", "rating", "memo", "createdAt"} <= set(x) for x in b))
counts = {x["id"]: x["_count"]["notes"] for x in b}
check("_count.notes 값 (1:2 · 5:2 · 10:1 · 18:1 · 나머지 0)",
      counts == {i: {1: 2, 5: 2, 10: 1, 18: 1}.get(i, 0) for i in range(1, 26)})
b5 = next(x for x in b if x["id"] == 5)
check("PDF 예시: 5 Clean Code tags [{id 3, 개발}] · _count.notes 2",
      b5["title"] == "Clean Code" and b5["tags"] == [{"id": 3, "name": "개발"}] and b5["_count"] == {"notes": 2})

for st, n in [("want", 9), ("reading", 8), ("done", 8)]:
    expect(f"status={st} → {n}권 · 모두 {st}", call("GET", "/books", query={"status": st}), 200,
           (lambda r: len(r) == n and all(x["status"] == st for x in r))(call("GET", "/books", query={"status": st})[1]))
for q, label in [({"status": "finish"}, "status=finish"), ({"status": "DONE"}, "status=DONE (대소문자 다름)"),
                 ({"status": ["want", "done"]}, "status 배열"), ({"keyword": ["a", "b"]}, "keyword 배열"),
                 ({"tag": ["SF", "소설"]}, "tag 배열")]:
    r = call("GET", "/books", query=q)
    expect(label, r, 400, is_message_only(r[1]))

for q, want, label in [
    ({"keyword": "code"}, [5], "keyword=code"),
    ({"keyword": "CODE"}, [5], "keyword=CODE (대소문자 무시)"),
    ({"keyword": "martin"}, [5, 7], "keyword=martin (저자 검색 · 대소문자 무시)"),
    ({"keyword": "한강"}, [1, 2, 3, 4], "keyword=한강 (저자)"),
    ({"keyword": "  code  "}, [5], "keyword 앞뒤 공백 제거"),
    ({"keyword": "   "}, list(range(1, 26)), "공백뿐인 keyword → 조건 없음"),
    ({"tag": "SF"}, [9, 10, 11], "tag=SF"),
    ({"tag": "소설"}, [1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 21, 22], "tag=소설 (15권)"),
    ({"tag": "소"}, [], "tag=소 (전체 일치만)"),
    ({"tag": "sf"}, [], "tag=sf (전체 일치 · 대소문자 구분)"),
    ({"tag": " SF "}, [9, 10, 11], "tag 앞뒤 공백 제거"),
    ({"status": "done", "keyword": "김"}, [8, 10, 15], "status=done&keyword=김 (PDF 예시)"),
    ({"status": "want", "tag": "소설"}, [4, 11, 12, 16, 21], "status=want&tag=소설"),
    ({"status": "done", "tag": "소설", "keyword": "김"}, [8, 10, 15], "status + tag + keyword (README Q1)"),
    ({"keyword": "김", "tag": "SF"}, [9, 10, 11], "keyword + tag"),
]:
    s, r, _ = call("GET", "/books", query=q)
    check(f"{label} → 200 · id {want}", s == 200 and ids(r) == want, f"{s} {ids(r) if isinstance(r, list) else r}")

# ───────────────────────────────────────────────────────────── 상세 · 태그 목록
sec("GET /books/:id 상세 · GET /tags (PDF 6 · 9쪽)")
b = expect("GET /books/1", call("GET", "/books/1"), 200)
check("상세에 notes 배열(등록순) · tags 포함",
      [n["page"] for n in b["notes"]] == [7, 134] and [n["id"] for n in b["notes"]] == [1, 2] and names(b["tags"]) == ["소설", "역사"])
check("노트 필드 id · page · content · createdAt · bookId", all(set(n) == {"id", "page", "content", "createdAt", "bookId"} for n in b["notes"]))
for p in ["/books/abc", "/books/0", "/books/-1", "/books/1.5"]:
    r = call("GET", p)
    expect(f"GET {p} (잘못된 id)", r, 400, is_message_only(r[1]))
r = call("GET", "/books/99")
expect("GET /books/99 (없음)", r, 404, is_message_only(r[1]))
s, t, _ = call("GET", "/tags")
pairs = [(x["id"], x["name"], x["_count"]["books"]) for x in t]
check("GET /tags → 200 · id 오름차순 · _count.books",
      s == 200 and pairs == [(1, "소설", 15), (2, "역사", 4), (3, "개발", 8), (4, "SF", 3), (5, "고전", 2), (6, "과학", 1)], pairs)
check("태그 필드 id · name · _count", all(set(x) == {"id", "name", "_count"} for x in t))

# ───────────────────────────────────────────────────────────── 등록
sec("POST /books 등록 (PDF 8쪽)")
b = expect("title · author만 → 201", call("POST", "/books", {"title": "  점검용 도서  ", "author": " 점검자 "}), 201)
check("기본값 status want · memo '' · rating null · tags []",
      b["status"] == "want" and b["memo"] == "" and b["rating"] is None and b["tags"] == [], b)
check("title · author 앞뒤 공백 제거 후 저장", b["title"] == "점검용 도서" and b["author"] == "점검자")
check("id · createdAt은 데이터베이스가 부여", isinstance(b["id"], int) and isinstance(b["createdAt"], str) and "T" in b["createdAt"])
check("201 응답에 tags 포함", "tags" in b)
for body, label in [
    ({"author": "a"}, "title 없음"), ({"title": "   ", "author": "a"}, "title 공백뿐"), ({"title": 1, "author": "a"}, "title 숫자"),
    ({"title": "t"}, "author 없음"), ({"title": "t", "author": ""}, "author 빈 문자열"),
    ({"title": "t", "author": "a", "status": "finished"}, "status 허용 값 아님"),
    ({"title": "t", "author": "a", "status": None}, "status null"),
    ({"title": "t", "author": "a", "memo": 1}, "memo 숫자"), ({"title": "t", "author": "a", "memo": None}, "memo null"),
    ({"title": "t", "author": "a", "rating": 3}, "완독 아님 + 별점"),
    ({"title": "t", "author": "a", "status": "reading", "rating": 5}, "reading + 별점"),
    ({"title": "t", "author": "a", "status": "done", "rating": 0}, "별점 0"),
    ({"title": "t", "author": "a", "status": "done", "rating": 6}, "별점 6"),
    ({"title": "t", "author": "a", "status": "done", "rating": 3.5}, "별점 3.5"),
    ({"title": "t", "author": "a", "status": "done", "rating": "5"}, "별점 문자열"),
    ({"title": "t", "author": "a", "tags": "개발"}, "tags 문자열"), ({"title": "t", "author": "a", "tags": {"a": 1}}, "tags 객체"),
    ({"title": "t", "author": "a", "tags": ["개발", 1]}, "tags에 숫자"), ({"title": "t", "author": "a", "tags": ["개발", ""]}, "tags 빈 이름"),
    ({"title": "t", "author": "a", "tags": ["개발", "   "]}, "tags 공백 이름"),
]:
    r = call("POST", "/books", body)
    expect(f"{label} → 400", r, 400, is_message_only(r[1]))
r = call("POST", "/books", raw="")
expect("본문 없음(Content-Type만) → 400", r, 400)
r = call("POST", "/books", json_header=False)
expect("본문 · Content-Type 없음 → 400", r, 400, is_message_only(r[1]))
expect("완독 + 별점 5 → 201", call("POST", "/books", {"title": "별점5", "author": "점검", "status": "done", "rating": 5}), 201,
       (lambda x: x["status"] == "done" and x["rating"] == 5)(call("GET", "/books", query={"keyword": "별점5"})[1][0]))
b = expect("완독 + 별점 1 (최솟값) → 201", call("POST", "/books", {"title": "별점1", "author": "점검", "status": "done", "rating": 1}), 201)
check("별점 1 저장", b["rating"] == 1)
b = expect("완독 + rating null → 201", call("POST", "/books", {"title": "별점없음", "author": "점검", "status": "done", "rating": None}), 201)
check("rating null 저장", b["rating"] is None)
b = expect("memo 지정 → 201", call("POST", "/books", {"title": "메모", "author": "점검", "memo": "메모 내용"}), 201)
check("memo 저장", b["memo"] == "메모 내용")
b = expect("tags [] → 201", call("POST", "/books", {"title": "태그없음", "author": "점검", "tags": []}), 201)
check("tags [] 저장", b["tags"] == [])
b = expect("tags ['  개발 ', '점검태그', '점검태그'] → 201",
           call("POST", "/books", {"title": "태그연결", "author": "점검", "tags": ["  개발 ", "점검태그", "점검태그"]}), 201)
tg = {t["name"]: t["id"] for t in b["tags"]}
check("공백 제거 · 중복 제거 → 태그 2개", sorted(tg) == ["개발", "점검태그"], b["tags"])
check("기존 태그 개발은 id 3에 연결(connect)", tg.get("개발") == 3)
check("새 태그 점검태그는 새로 생성(id > 6)", tg.get("점검태그", 0) > 6)
t = {x["name"]: x["_count"]["books"] for x in call("GET", "/tags")[1]}
check("GET /tags: 개발 9 · 점검태그 1 (태그 7개)", t.get("개발") == 9 and t.get("점검태그") == 1 and len(t) == 7, t)
r = call("POST", "/books", {"title": "소년이 온다", "author": "한강"})
expect("같은 제목 + 저자 → 409", r, 409, isinstance(r[1], dict) and set(r[1]) == {"message", "code"} and r[1]["code"] == "P2002")
check("409 응답에 오류 메시지 원문 없음", "Unique constraint" not in r[2] and "books_title_author_key" not in r[2], r[2])
expect("공백 제거 후 같은 제목 + 저자 → 409", call("POST", "/books", {"title": " 소년이 온다 ", "author": "한강 "}), 409)
expect("같은 제목 · 다른 저자 → 201", call("POST", "/books", {"title": "소년이 온다", "author": "다른 저자"}), 201)

# ───────────────────────────────────────────────────────────── 수정
sec("PATCH /books/:id 수정 (PDF 8쪽 · TODO 13 ①~⑤)")
b = expect("2(done · 4점) memo만 → 200", call("PATCH", "/books/2", {"memo": "점검 메모"}), 200)
check("memo만 변경 · status · rating · title 유지", b["memo"] == "점검 메모" and b["status"] == "done" and b["rating"] == 4 and b["title"] == "채식주의자", b)
b = expect("2(done) rating 2 → 200", call("PATCH", "/books/2", {"rating": 2}), 200)
check("rating 2", b["rating"] == 2 and b["status"] == "done")
b = expect("2 done → reading → 200", call("PATCH", "/books/2", {"status": "reading"}), 200)
check("done → 다른 상태: rating null 초기화", b["status"] == "reading" and b["rating"] is None, b)
b = expect("8(done · 3점) → want → 200", call("PATCH", "/books/8", {"status": "want"}), 200)
check("done → want: rating null", b["rating"] is None)
r = call("PATCH", "/books/3", {"rating": 4})
expect("3(reading) rating만 → 400 (수정 후 상태가 완독 아님)", r, 400, is_message_only(r[1]))
check("400이면 3은 바뀌지 않음", call("GET", "/books/3")[1]["rating"] is None)
expect("4(want) status reading + rating 4 → 400", call("PATCH", "/books/4", {"status": "reading", "rating": 4}), 400)
check("400이면 4의 status도 바뀌지 않음 (부분 반영 없음)", call("GET", "/books/4")[1]["status"] == "want")
b = expect("4(want) status done + rating 4 → 200", call("PATCH", "/books/4", {"status": "done", "rating": 4}), 200)
check("done · 4점", b["status"] == "done" and b["rating"] == 4)
b = expect("4 rating null → 200", call("PATCH", "/books/4", {"rating": None}), 200)
check("rating null 저장", b["rating"] is None and b["status"] == "done")
b = expect("6(reading) status done만 → 200", call("PATCH", "/books/6", {"status": "done"}), 200)
check("done · rating null", b["status"] == "done" and b["rating"] is None)
b = expect("1 title + memo → 200 (title은 무시)", call("PATCH", "/books/1", {"title": "바꾸기", "memo": "m"}), 200)
check("memo만 변경 · title 유지", b["memo"] == "m" and b["title"] == "소년이 온다")
check("PATCH 응답은 수정된 도서", {"id", "title", "author", "status", "rating", "memo", "createdAt"} <= set(b))
for body, label in [({}, "빈 본문 {} (①)"), ({"title": "x"}, "수정 가능한 필드 없음 (①)"),
                    ({"status": "x"}, "status 허용 값 아님 (②)"), ({"rating": 6}, "rating 6 (②)"),
                    ({"rating": 0}, "rating 0 (②)"), ({"rating": "3"}, "rating 문자열 (②)"),
                    ({"rating": 2.5}, "rating 2.5 (②)"), ({"memo": 1}, "memo 숫자 (②)"), ({"memo": None}, "memo null (②)")]:
    r = call("PATCH", "/books/1", body)
    expect(f"{label} → 400", r, 400, is_message_only(r[1]))
expect("본문 · Content-Type 없음 → 400 (①)", call("PATCH", "/books/1", json_header=False), 400)
r = call("PATCH", "/books/99", {"memo": "x"})
expect("없는 도서 memo → 404 (③)", r, 404, is_message_only(r[1]))
expect("없는 도서 rating 4 → 404 (③이 ④보다 먼저)", call("PATCH", "/books/99", {"rating": 4}), 404)
expect("없는 도서 status reading + rating 4 → 404 (③이 ④보다 먼저)", call("PATCH", "/books/99", {"status": "reading", "rating": 4}), 404)
expect("없는 도서 status 잘못된 값 → 400 (②가 ③보다 먼저)", call("PATCH", "/books/99", {"status": "x"}), 400)
for p in ["/books/abc", "/books/0"]:
    expect(f"PATCH {p} → 400", call("PATCH", p, {"memo": "x"}), 400)
r = call("PATCH", "/books/1", raw='{ "memo": "따옴표 누락 }')
expect("잘못된 JSON → 400", r, 400, is_message_only(r[1]))

# ───────────────────────────────────────────────────────────── 노트
sec("POST /books/:id/notes · DELETE /books/:id/notes/:noteId (PDF 9쪽)")
n1 = expect("2에 노트 등록 (page 1 최솟값) → 201", call("POST", "/books/2/notes", {"page": 1, "content": "  점검 노트  "}), 201)
check("노트 필드 id · page · content · createdAt · bookId", set(n1) == {"id", "page", "content", "createdAt", "bookId"}, n1)
check("bookId = 경로의 id · content 앞뒤 공백 제거", n1["bookId"] == 2 and n1["content"] == "점검 노트" and n1["page"] == 1)
n2 = expect("2에 노트 하나 더 → 201", call("POST", "/books/2/notes", {"page": 300, "content": "두 번째"}), 201)
d = call("GET", "/books/2")[1]
check("상세 notes 등록순(id 오름차순)", [x["id"] for x in d["notes"]] == [n1["id"], n2["id"]])
for body, label in [({"page": 0, "content": "c"}, "page 0"), ({"page": -1, "content": "c"}, "page -1"),
                    ({"page": 1.5, "content": "c"}, "page 1.5"), ({"page": "3", "content": "c"}, "page 문자열"),
                    ({"page": None, "content": "c"}, "page null"), ({"content": "c"}, "page 없음"),
                    ({"page": 1, "content": ""}, "content 빈 문자열"), ({"page": 1, "content": "   "}, "content 공백뿐"),
                    ({"page": 1}, "content 없음"), ({"page": 1, "content": 123}, "content 숫자")]:
    r = call("POST", "/books/2/notes", body)
    expect(f"{label} → 400", r, 400, is_message_only(r[1]))
expect("본문 · Content-Type 없음 → 400", call("POST", "/books/2/notes", json_header=False), 400)
r = call("POST", "/books/99/notes", {"page": 1, "content": "c"})
expect("없는 도서에 노트 → 404 (P2003)", r, 404, is_message_only(r[1]))
for p in ["/books/abc/notes", "/books/0/notes"]:
    expect(f"POST {p} → 400", call("POST", p, {"page": 1, "content": "c"}), 400)
r = call("DELETE", f"/books/1/notes/{n1['id']}")
expect("다른 도서 경로로 노트 삭제 → 404", r, 404, is_message_only(r[1]))
check("404면 노트는 그대로 남음", n1["id"] in [x["id"] for x in call("GET", "/books/2")[1]["notes"]])
s, b, raw = call("DELETE", f"/books/2/notes/{n1['id']}")
check("노트 삭제 → 204 · 본문 없음", s == 204 and raw == "", f"{s} {raw!r}")
expect("같은 노트 다시 삭제 → 404", call("DELETE", f"/books/2/notes/{n1['id']}"), 404)
expect("없는 노트 → 404", call("DELETE", "/books/2/notes/99999"), 404)
for p in ["/books/2/notes/abc", "/books/2/notes/0", "/books/abc/notes/1", "/books/2/notes/1.5"]:
    expect(f"DELETE {p} → 400", call("DELETE", p), 400)

# ───────────────────────────────────────────────────────────── 도서 삭제
sec("DELETE /books/:id 도서 삭제 (PDF 6 · 3쪽)")
before = {x["name"]: x["_count"]["books"] for x in call("GET", "/tags")[1]}
s, b, raw = call("DELETE", "/books/1")
check("1(노트 2 · 소설 · 역사) 삭제 → 204 · 본문 없음", s == 204 and raw == "", f"{s} {raw!r}")
expect("삭제한 도서 조회 → 404", call("GET", "/books/1"), 404)
expect("같은 도서 다시 삭제 → 404", call("DELETE", "/books/1"), 404)
after = {x["name"]: x["_count"]["books"] for x in call("GET", "/tags")[1]}
check("태그 연결만 삭제: 소설 · 역사 수 -1, 태그 행은 유지",
      after["소설"] == before["소설"] - 1 and after["역사"] == before["역사"] - 1 and set(after) == set(before), f"{before} → {after}")
expect("삭제한 도서의 노트 1 삭제 → 404", call("DELETE", "/books/1/notes/1"), 404)
r = call("DELETE", "/books/99")
expect("없는 도서 삭제 → 404", r, 404, is_message_only(r[1]))
for p in ["/books/abc", "/books/0"]:
    expect(f"DELETE {p} → 400", call("DELETE", p), 400)

# ───────────────────────────────────────────────────────────── 오류 처리 · 그 외 경로
sec("오류 처리 · 그 외 경로 (PDF 6 · 10쪽)")
r = call("POST", "/books", raw='{ "title": "따옴표 누락, }')
expect("잘못된 JSON → 400 { message }", r, 400, is_message_only(r[1]))
for m, p in [("GET", "/users"), ("PUT", "/books/2"), ("POST", "/tags"), ("DELETE", "/tags"), ("GET", "/books/2/notes")]:
    r = call(m, p)
    expect(f"{m} {p} (그 외 경로) → 404", r, 404, is_message_only(r[1]))

print(f"\n일치 {sum(results)} / {len(results)}")
sys.exit(0 if all(results) else 1)
