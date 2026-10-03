import { isAxiosError } from 'axios'

// Бекенд повертає { code, message }; показуємо його текст, а не "Request failed with status code 409".
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown; errors?: { field?: unknown; message?: unknown }[] }
      | undefined

    if (typeof data?.message === 'string' && data.message) {
      return data.message
    }

    // Помилки валідації (zod) приходять списком: показуємо першу з назвою поля.
    const first = data?.errors?.[0]
    if (first && typeof first.message === 'string') {
      return typeof first.field === 'string' ? `${first.field}: ${first.message}` : first.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}
