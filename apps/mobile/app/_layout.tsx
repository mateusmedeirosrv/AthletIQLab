import { useEffect } from 'react'
import { Stack, useRouter, useSegments, ErrorBoundary } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '../context/auth'
import { BrandProvider, DEFAULT_BRAND_COLOR } from '../context/brand'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { session, role, hasStudentProfile, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === '(auth)'
    const inStudent = segments[0] === '(student)'
    const inPersonal = segments[0] === '(personal)'
    const authSeg1 = (segments as string[])[1]

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login')
      return
    }

    if (role === 'student') {
      if (!hasStudentProfile) {
        if (!(inAuth && authSeg1 === 'invite')) router.replace('/(auth)/invite')
        return
      }
      if (!inStudent) router.replace('/(student)/workouts')
      return
    }

    if (role === 'personal') {
      if (!inPersonal) router.replace('/(personal)')
      return
    }
  }, [session, role, hasStudentProfile, loading, segments])

  return <>{children}</>
}

export { ErrorBoundary }

function BrandedApp() {
  const { studentProfile } = useAuth()
  return (
    <BrandProvider
      primaryColor={studentProfile?.brandPrimaryColor ?? DEFAULT_BRAND_COLOR}
      logoUrl={studentProfile?.brandLogoUrl ?? null}
      professionalName={studentProfile?.professionalName ?? null}
    >
      <NavigationGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </NavigationGuard>
      <StatusBar style="auto" />
    </BrandProvider>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandedApp />
      </AuthProvider>
    </QueryClientProvider>
  )
}
