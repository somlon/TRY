// Prisma 오류 코드 확인 함수 (제공 — 수정하지 않음)
import { Prisma } from '../generated/prisma/client.js';

// Prisma 오류의 코드가 code와 같은지 확인
// P2025 — 대상 행 없음. P2003 — 외래키 제약 위반. P2002 — 고유 제약 위반
export function isPrismaError(err: unknown, code: string): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError
    && err.code === code;
}
