export type AuthStateStatus = 'checking' | 'authenticated' | 'unauthenticated'

export type UserRole = 'user' | 'admin' | 'moderator'

export interface AuthState {
  status: AuthStateStatus
  accessToken: string | null

  user: {
    id: string
    email: string
    name?: string
    role: UserRole
    // Мова з профілю (кабінет, листи); старі сесії можуть її не мати.
    locale?: 'en' | 'es' | 'uk'
    sessionId: string
  } | null
  form: {
    email: string
    name: string
    password: string
    confirmPassword: string
  }

  setAuth: (data: SetAuthData) => void
  setAuthStatus: (status: AuthStateStatus) => void
  clearAuth: () => void
  
  setAuthFormField: (key: string, value: string) => void
  cearAuthForm: () => void
}

export interface SetAuthData {
  accessToken: string | null
  user: {
    id: string
    email: string
    name?: string
    role: UserRole
    // Мова з профілю (кабінет, листи); старі сесії можуть її не мати.
    locale?: 'en' | 'es' | 'uk'
    sessionId: string
  } | null
}

export interface SetAuthFormData {
  email: string
  name?: string
  password: string
  passwordConfirm?: string
}

export interface AuthInputProps  {
  name: string
  label: string
  autoComplete?: string
  value: string
  placeholder: string
  type?: string
  error?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}