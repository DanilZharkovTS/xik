export const ApiError = (status: number, message: string, code?: string) => {
  return {
    status,
    message,
    code,
  }
}

export const isApiError = (
  err: unknown
): err is {
  status: number
  code: string
  message: string
} => {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'code' in err &&
    'message' in err
  )
}
