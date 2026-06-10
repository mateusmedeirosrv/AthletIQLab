import { supabase } from './supabase'

const BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function request<T>(method: string, path: string, body?: unknown): Promise<{ data: T }> {
  const token = await getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const init: RequestInit = { method, headers }
  if (body !== undefined) init.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, init)

  const json = (await res.json()) as { data: T; error?: { message: string } }

  if (!res.ok) {
    throw new Error(json.error?.message ?? `Request failed: ${res.status}`)
  }

  return json as { data: T }
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
}
