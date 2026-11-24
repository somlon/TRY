// PrismaClient 생성 및 공유 (제공 — 수정하지 않음)
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { config } from './config.js';

// pg 드라이버 어댑터 — PostgreSQL 연결 준비
const adapter = new PrismaPg({
  connectionString: config.DATABASE_URL,
});

// 서버 전체에서 하나만 생성하여 공유
export const prisma = new PrismaClient({ adapter });
