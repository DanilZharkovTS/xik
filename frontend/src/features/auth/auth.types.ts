export type AuthStateStatus = 'checking' | 'authenticated' | 'unauthenticated'

export type UserRole = 'user' | 'admin' | 'moderator'

export interface AuthState {
  status: AuthStateStatus
  accessToken: string | null

  user: {
    id: string
    email: string
    role: UserRole
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
    role: UserRole
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
  value: string
  placeholder: string
  type?: string
  error?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}