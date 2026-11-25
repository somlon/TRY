import { defineConfig, env } from 'prisma/config';

// Prisma CLI는 --env-file을 거치지 않으므로
// .env를 직접 읽음 (제공 — 수정하지 않음)
process.loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',   // npx prisma db seed가 실행하는 명령
  },
  datasource: { url: env('DATABASE_URL') },
});
