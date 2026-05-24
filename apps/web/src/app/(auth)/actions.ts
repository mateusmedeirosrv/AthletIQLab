'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000'

export async function signInWithGoogle() {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${appUrl}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error) throw new Error(error.message)
  if (data.url) redirect(data.url as `${string}:${string}`)
}

export async function signInWithMagicLink(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return { error: 'E-mail obrigatório' }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function signInWithPassword(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  if (!email || !password) return { error: 'E-mail e senha são obrigatórios' }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
