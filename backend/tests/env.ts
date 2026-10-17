// Виконується до імпорту застосунку: підміняє змінні середовища на тестові.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:1234@localhost:5432/xik_test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.STRIPE_SECRET = process.env.STRIPE_SECRET ?? 'sk_test_dummy'
process.env.REPORT_TIMEZONE = 'Europe/Kyiv'
// Усі тести йдуть з однієї адреси: ліміти за IP піднято, щоб вони не заважали.
// Ліміти за e-mail і користувачем лишаються робочими й перевіряються окремо.
process.env.PASSWORD_RESET_IP_RATE_LIMIT = '10000'
process.env.REGISTER_RATE_LIMIT = '10000'
