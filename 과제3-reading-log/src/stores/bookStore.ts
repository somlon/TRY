// bookStore — 도서 데이터의 조회, 등록, 수정, 삭제 담당
// HTTP를 알지 못한다: 상태 코드를 정하지 않고 데이터, null, boolean만 반환한다.
// 모든 함수는 db.ts의 prisma(PrismaClient)로 데이터베이스에 질의한다.

// 이름 / 학번

import { prisma } from '../db.js';
import { Prisma, type Book } from '../generated/prisma/client.js';
import { isPrismaError } from './prismaError.js';
import type { BookChanges, ListOptions, NewBook } from '../types.js';

// TODO 4: 조건에 맞는 도서 배열을 반환하라. (반환 타입은 작성하지 않아도 됨)
//   - options.status가 있으면 그 상태의 도서만 조회한다.
//   - options.keyword가 있으면 제목 또는 저자에 keyword가 포함된 도서만 조회한다.
//     (영문 대소문자는 구분하지 않음 — OR, contains, mode: 'insensitive')
//   - options.tag가 있으면 그 이름의 태그가 붙은 도서만 조회한다. (some)
//   - 조건이 여러 개이면 모든 조건을 만족하는 도서만 조회한다.
//   - 순서는 id 오름차순
//   - 도서마다 태그 목록(tags)과 노트 수(_count.notes)를 포함한다.
//   - [설명] 주석 한 줄로 노트 내용(include의 notes) 대신 _count로
//     노트 수만 조회하는 이유를 남겨라.
export function findAll(options: ListOptions) {
  // 지정된 조건만 where에 추가 — 속성이 여러 개이면 모두 만족하는 도서만 조회
  const where: Prisma.BookWhereInput = {};
  if (options.status !== undefined) where.status = options.status;
  if (options.keyword !== undefined) {
    where.OR = [
      { title: { contains: options.keyword, mode: 'insensitive' } },
      { author: { contains: options.keyword, mode: 'insensitive' } },
    ];
  }
  if (options.tag !== undefined) where.tags = { some: { name: options.tag } };

  return prisma.book.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      tags: true,
      // [설명] 목록에는 노트 수만 응답하므로, 노트 내용 전체를 가져오는 include의 notes 대신 _count로 개수만 조회해 조회량과 응답 크기를 줄인다.
      _count: { select: { notes: true } },
    },
  });
}

// [제공 예시] 상세 조회 — 노트(등록순)와 태그 포함. 없으면 null (수정 불필요)
// include로 관계 데이터를 함께 조회하는 Store 함수의 형태를 참고하라.
export function findById(id: number) {
  return prisma.book.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { id: 'asc' } },
      tags: true,
    },
  });
}

// TODO 5: 새 도서를 등록하고, 태그 목록을 포함한 도서를 반환하라.
//   - input.tags의 태그 이름마다 같은 이름의 태그가 있으면 연결, 없으면 생성 후 연결한다.
//     (connectOrCreate)
//   - 같은 제목 + 저자의 도서가 이미 있으면 데이터베이스가 P2002 오류를 발생시킨다.
//     이 오류는 처리하지 않고 그대로 두어 에러 핸들러가 409로 응답하게 한다.
export function create(input: NewBook) {
  return prisma.book.create({
    data: {
      title: input.title,
      author: input.author,
      status: input.status,
      rating: input.rating,
      memo: input.memo,
      // 태그 이름마다 있으면 연결, 없으면 생성 후 연결
      tags: {
        connectOrCreate: input.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: { tags: true },
  });
}

// TODO 6: 도서를 부분 수정하고, 수정한 도서를 반환하라. 대상이 없으면 null.
//   - changes에 전달된 필드만 변경한다.
//   - status가 'done'이 아닌 상태로 바뀌면 rating을 null로 초기화한다.
//   - 대상 도서가 없을 때의 오류(P2025)만 null로 바꾸고, 그 밖의 오류는 다시 던진다.
export async function update(
  id: number, changes: BookChanges,
): Promise<Book | null> {
  // 전달된 필드만 data에 담음 (exactOptionalPropertyTypes — undefined를 넣지 않음)
  const data: Prisma.BookUpdateInput = {};
  if (changes.status !== undefined) data.status = changes.status;
  if (changes.rating !== undefined) data.rating = changes.rating;
  if (changes.memo !== undefined) data.memo = changes.memo;
  // 완독이 아닌 상태로 바뀌면 별점 초기화
  if (changes.status !== undefined && changes.status !== 'done') {
    data.rating = null;
  }

  try {
    return await prisma.book.update({ where: { id }, data });
  } catch (err) {
    if (isPrismaError(err, 'P2025')) return null;   // 대상 도서 없음
    throw err;   // 그 밖의 오류는 에러 핸들러로
  }
}

// TODO 7: 도서를 삭제하라. 삭제했으면 true, 대상이 없으면(P2025) false.
//   - 노트와 태그 연결 행은 데이터베이스가 함께 삭제하므로 따로 삭제하지 않는다.
export async function remove(id: number): Promise<boolean> {
  try {
    await prisma.book.delete({ where: { id } });
    return true;
  } catch (err) {
    if (isPrismaError(err, 'P2025')) return false;   // 대상 도서 없음
    throw err;
  }
}
