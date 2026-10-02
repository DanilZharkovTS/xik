import { isAxiosError } from 'axios'

// Бекенд повертає { code, message }; показуємо його текст, а не "Request failed with status code 409".
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)
      ?.message

    if (typeof message === 'string' && message) {
      return message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}
