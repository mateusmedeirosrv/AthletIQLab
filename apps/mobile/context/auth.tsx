import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api'

WebBrowser.maybeCompleteAuthSession()

interface StudentProfile {
  userId: string
  personalId: string
  name: string
  status: string
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  role: 'personal' | 'student' | null
  studentProfile: StudentProfile | null
  hasStudentProfile: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshStudentProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<'personal' | 'student' | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchStudentProfile() {
    try {
      const res = await apiClient.get<StudentProfile>('/students/me')
      setStudentProfile(res.data)
    } catch {
      setStudentProfile(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      const r =
        (s?.user?.user_metadata?.['role'] as 'personal' | 'student' | undefined) ?? 'student'
      setRole(r)
      if (s && r === 'student') {
        fetchStudentProfile().finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      const r =
        (s?.user?.user_metadata?.['role'] as 'personal' | 'student' | undefined) ?? 'student'
      setRole(r)
      if (s && r === 'student') {
        fetchStudentProfile()
      } else {
        setStudentProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    const redirectTo = makeRedirectUri({ scheme: 'athletiqlab' })
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setStudentProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        studentProfile,
        hasStudentProfile: studentProfile !== null,
        loading,
        signInWithGoogle,
        signOut,
        refreshStudentProfile: fetchStudentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
