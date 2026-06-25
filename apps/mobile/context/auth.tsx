import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { makeRedirectUri } from 'expo-auth-session'
import * as Notifications from 'expo-notifications'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api'

WebBrowser.maybeCompleteAuthSession()

interface StudentProfile {
  userId: string
  personalId: string
  name: string
  status: string
  brandPrimaryColor: string | null
  brandLogoUrl: string | null
  professionalName: string | null
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

  async function registerPushToken() {
    try {
      const permissions = await Notifications.requestPermissionsAsync()
      // expo-notifications v56 has a platform-specific type; check ios.status or android implicit grant
      const isGranted =
        Platform.OS === 'ios'
          ? permissions.ios?.status === 2 // IosAuthorizationStatus.AUTHORIZED
          : true // Android grants automatically on older API levels
      if (!isGranted) return
      const tokenData = await Notifications.getExpoPushTokenAsync()
      const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android'
      await apiClient.post('/notifications/push-token', {
        expoToken: tokenData.data,
        platform,
      })
    } catch {
      // Non-critical — user denied or device has no push support
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

    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      const r =
        (s?.user?.user_metadata?.['role'] as 'personal' | 'student' | undefined) ?? 'student'
      setRole(r)
      if (s && r === 'student') {
        fetchStudentProfile()
        if (event === 'SIGNED_IN') void registerPushToken()
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
