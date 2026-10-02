import { create } from 'zustand'
import {
  AuthState,
  AuthStateStatus,
  SetAuthData,
} from './auth.types'

const useAuthStore = create<AuthState>((set) => ({
  status: 'checking',
  accessToken: null,
  user: null,
  form: {
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  },

  setAuth: (data: SetAuthData) =>
    set({
      status: 'authenticated',
      accessToken: data.accessToken,
      user: data.user,
    }),
  setAuthStatus: (status: AuthStateStatus) => set({ status: status }),
  clearAuth: () =>
    set({
      status: 'unauthenticated',
      accessToken: null,
      user: null,
      form: {
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
      },
    }),

  setAuthFormField: (key: string, value: string) =>
    set((state) => ({
      form: {
        ...state.form,
        [key]: value,
      },
    })),
  cearAuthForm: () =>
    set({
      form: {
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
      },
    }),
}))

export default useAuthStore
