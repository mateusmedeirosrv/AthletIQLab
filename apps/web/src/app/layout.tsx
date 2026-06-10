import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { PostHogProvider } from '@/components/posthog-provider'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://app.athletiqlab.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563EB',
}

export const metadata: Metadata = {
  title: {
    default: 'AthletiQLab — Treinos com IA para Profissionais de Ed. Física',
    template: '%s | AthletiQLab',
  },
  description:
    'Personal trainers, fisioterapeutas e treinadores esportivos criam treinos personalizados em conversa com IA e entregam aos clientes em experiência estilo Reels.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: APP_URL,
    siteName: 'AthletiQLab',
    title: 'AthletiQLab — Treinos com IA para Profissionais de Ed. Física',
    description:
      'Personal trainers, fisioterapeutas e treinadores esportivos criam treinos personalizados em conversa com IA.',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'AthletiQLab — Treinos personalizados com IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AthletiQLab — Treinos com IA para Profissionais de Ed. Física',
    description:
      'Crie treinos personalizados em conversa com IA. Disponível para CREF, CREFITO e outros profissionais de saúde física.',
    images: [`${APP_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Suspense>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
      </body>
    </html>
  )
}
