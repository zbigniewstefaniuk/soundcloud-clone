import { api } from './client'
import { handleError } from './error';



export async function register(data: { username: string; email: string; password: string }) {
  const { data: response, error } = await api.auth.register.post(data)

  if (error) {
    handleError(error)
  }

  return response!
}

export async function login(data: { email: string; password: string }) {
  const { data: response, error } = await api.auth.login.post(data)

  if (error) {
    handleError(error)
  }

  return response!
}

export async function getCurrentUser() {
  const { data: response, error } = await api.auth.me.get()

  if (error) {
    handleError(error)
  }

  return response!.data
}

export async function getUserById(id: string) {
  const { data: response, error } = await api.users({ id }).get()

  if (error) {
    handleError(error)
  }

  return response!.data
}
