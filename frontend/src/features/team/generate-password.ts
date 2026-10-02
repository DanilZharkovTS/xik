// Без схожих символів (0/O, 1/l/I), щоб пароль легко читався з телефона.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePassword(length = 14): string {
  const limit = 256 - (256 % ALPHABET.length)
  let result = ''

  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length))

    for (const byte of bytes) {
      // Відкидаємо хвіст діапазону, щоб розподіл символів був рівномірним.
      if (byte < limit && result.length < length) {
        result += ALPHABET[byte % ALPHABET.length]
      }
    }
  }

  return result
}
