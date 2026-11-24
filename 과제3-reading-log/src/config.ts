// 환경 변수 검증 (제공 — 수정하지 않음)
const PORT = Number(process.env.PORT ?? 3000);
const DATABASE_URL = process.env.DATABASE_URL;

// 필수값이 없으면 서버를 시작하지 않음
if (!DATABASE_URL) {
  throw new Error('.env에 DATABASE_URL 필요');
}

export const config = { PORT, DATABASE_URL };
