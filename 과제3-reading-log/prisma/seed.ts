// 초기 데이터 입력 (제공 — 수정하지 않음)
// npm run reset → 테이블 초기화(migrate reset) 후 이 파일 실행(db seed)
// 도서 25권을 순서대로 등록하므로 도서 id는 1~25,
// 태그 id는 처음 등장한 순서(소설 1, 역사 2, 개발 3, SF 4, 고전 5, 과학 6)

import { prisma } from '../src/db.js';

interface SeedBook {
  title: string;
  author: string;
  status: 'want' | 'reading' | 'done';
  rating: number | null;
  memo: string;
  tags: string[];
  notes: { page: number; content: string }[];
}

const books: SeedBook[] = [
  { title: '소년이 온다', author: '한강', status: 'done', rating: 5,
    memo: '5·18을 다룬 소설', tags: ['소설', '역사'],
    notes: [
      { page: 7, content: '첫 장의 2인칭 시점' },
      { page: 134, content: '여섯 개의 장이 서로 다른 인물의 시점으로 연결됨' },
    ] },
  { title: '채식주의자', author: '한강', status: 'done', rating: 4,
    memo: '', tags: ['소설'], notes: [] },
  { title: '작별하지 않는다', author: '한강', status: 'reading', rating: null,
    memo: '', tags: ['소설', '역사'], notes: [] },
  { title: '흰', author: '한강', status: 'want', rating: null,
    memo: '', tags: ['소설'], notes: [] },
  { title: 'Clean Code', author: 'Robert C. Martin', status: 'done', rating: null,
    memo: '함수는 한 가지 일만', tags: ['개발'],
    notes: [
      { page: 44, content: '함수는 작게, 한 가지 일만 수행' },
      { page: 68, content: '주석보다 의도를 드러내는 이름' },
    ] },
  { title: 'The Pragmatic Programmer', author: 'David Thomas', status: 'reading',
    rating: null, memo: '', tags: ['개발'], notes: [] },
  { title: 'Refactoring', author: 'Martin Fowler', status: 'want', rating: null,
    memo: '', tags: ['개발'], notes: [] },
  { title: '살인자의 기억법', author: '김영하', status: 'done', rating: 3,
    memo: '', tags: ['소설'], notes: [] },
  { title: '작별인사', author: '김영하', status: 'reading', rating: null,
    memo: '', tags: ['소설', 'SF'], notes: [] },
  { title: '우리가 빛의 속도로 갈 수 없다면', author: '김초엽', status: 'done',
    rating: 5, memo: 'SF 단편집', tags: ['소설', 'SF'],
    notes: [{ page: 52, content: '「스펙트럼」의 색으로 대화하는 외계 존재' }] },
  { title: '지구 끝의 온실', author: '김초엽', status: 'want', rating: null,
    memo: '', tags: ['소설', 'SF'], notes: [] },
  { title: '김약국의 딸들', author: '박경리', status: 'want', rating: null,
    memo: '', tags: ['소설'], notes: [] },
  { title: '토지 1', author: '박경리', status: 'reading', rating: null,
    memo: '', tags: ['소설', '역사'], notes: [] },
  { title: '아몬드', author: '손원평', status: 'done', rating: 4,
    memo: '', tags: ['소설'], notes: [] },
  { title: '불편한 편의점', author: '김호연', status: 'done', rating: null,
    memo: '', tags: ['소설'], notes: [] },
  { title: '달러구트 꿈 백화점', author: '이미예', status: 'want', rating: null,
    memo: '', tags: ['소설'], notes: [] },
  { title: '모던 자바스크립트 Deep Dive', author: '이웅모', status: 'reading',
    rating: null, memo: '', tags: ['개발'], notes: [] },
  { title: 'Node.js 교과서', author: '조현영', status: 'reading', rating: null,
    memo: 'Express 복습용', tags: ['개발'],
    notes: [{ page: 210, content: '미들웨어는 등록한 순서대로 실행' }] },
  { title: '이것이 자바다', author: '신용권', status: 'done', rating: 4,
    memo: '', tags: ['개발'], notes: [] },
  { title: '쉽게 배우는 운영체제', author: '조성호', status: 'want', rating: null,
    memo: '', tags: ['개발'], notes: [] },
  { title: '데미안', author: '헤르만 헤세', status: 'want', rating: null,
    memo: '', tags: ['소설', '고전'], notes: [] },
  { title: '어린 왕자', author: '생텍쥐페리', status: 'reading', rating: null,
    memo: '', tags: ['소설', '고전'], notes: [] },
  { title: 'Effective TypeScript', author: 'Dan Vanderkam', status: 'reading',
    rating: null, memo: '', tags: ['개발'], notes: [] },
  { title: '코스모스', author: '칼 세이건', status: 'want', rating: null,
    memo: '', tags: ['과학'], notes: [] },
  { title: '사피엔스', author: '유발 하라리', status: 'want', rating: null,
    memo: '', tags: ['역사'], notes: [] },
];

async function main(): Promise<void> {
  // 이미 데이터가 있으면 입력하지 않음 — npm run reset은 테이블을 비운 뒤 실행
  if (await prisma.book.count() > 0) {
    console.log('이미 데이터가 있음 — npm run reset으로 초기화한 뒤 다시 실행');
    return;
  }
  // 순서대로 한 권씩 등록 — 도서, 태그, 노트의 id가 항상 같은 값으로 부여됨
  for (const b of books) {
    const { tags, notes, ...fields } = b;
    await prisma.book.create({
      data: {
        ...fields,
        tags: {
          connectOrCreate: tags.map((name) => ({
            where: { name }, create: { name },
          })),
        },
        notes: { create: notes },
      },
    });
  }
  console.log(`초기 데이터 입력 완료: 도서 ${books.length}권`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
