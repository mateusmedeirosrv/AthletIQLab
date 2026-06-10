'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

interface CrispChatProps {
  userId?: string | undefined
  userEmail?: string | undefined
  userName?: string | undefined
}

export function CrispChat({ userId, userEmail, userName }: CrispChatProps) {
  useEffect(() => {
    const websiteId = process.env['NEXT_PUBLIC_CRISP_WEBSITE_ID']
    if (!websiteId) return

    window.$crisp = []
    window.CRISP_WEBSITE_ID = websiteId

    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)

    // Pre-fill user info for authenticated users
    if (userEmail) {
      window.$crisp.push(['set', 'user:email', userEmail])
    }
    if (userName) {
      window.$crisp.push(['set', 'user:nickname', userName])
    }
    if (userId) {
      window.$crisp.push(['set', 'session:data', [[['user_id', userId]]]])
    }

    return () => {
      document.head.removeChild(script)
    }
  }, [userId, userEmail, userName])

  return null
}
