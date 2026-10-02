export const ApiError = (status: number, code: string, message: string) => {
  return { status, code, message }
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
