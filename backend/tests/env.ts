// Виконується до імпорту застосунку: підміняє змінні середовища на тестові.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:1234@localhost:5432/xik_test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.STRIPE_SECRET = process.env.STRIPE_SECRET ?? 'sk_test_dummy'
process.env.REPORT_TIMEZONE = 'Europe/Kyiv'
