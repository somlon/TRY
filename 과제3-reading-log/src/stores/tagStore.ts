// tagStore — 태그 데이터의 조회 담당

// 이름 / 학번

import { prisma } from '../db.js';

// TODO 10: 태그 목록을 반환하라. (반환 타입은 작성하지 않아도 됨)
//   - 순서는 id 오름차순
//   - 태그마다 그 태그가 붙은 도서 수(_count.books)를 포함한다.
//     예) [{ "id": 1, "name": "소설", "_count": { "books": 15 } }, …]
export function findAll() {
  throw new Error('TODO 10: findAll을 구현하세요');
}
