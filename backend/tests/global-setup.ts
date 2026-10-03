import { execSync } from 'node:child_process'

// Тести йдуть на реальному Postgres (не SQLite): міграції накочуються перед запуском.
export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://postgres:1234@localhost:5432/xik_test'

  execSync('npx prisma migrate deploy --config prisma7.config.ts', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })
}
