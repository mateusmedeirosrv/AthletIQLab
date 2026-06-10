'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'

interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: string
  readAt: string | null
  createdAt: string
}

interface Conversation {
  id: string
  personalId: string
  studentId: string
  messages: ChatMessage[]
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function apiFetch<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    },
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `${res.status}`)
  }
  const json = (await res.json()) as { data: T }
  return json.data
}

interface ChatSectionProps {
  studentId: string
  userId: string
  token: string
}

export function ChatSection({ studentId, userId, token }: ChatSectionProps) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  )

  async function openChat() {
    setLoading(true)
    try {
      const c = await apiFetch<Conversation>('/conversations', token, {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      })
      const detail = await apiFetch<Conversation>(`/conversations/${c.id}`, token)
      setConv(detail)
      setMessages(detail.messages)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  // Supabase Realtime subscription once conversation is loaded
  useEffect(() => {
    if (!conv) return

    const channel = supabase
      .channel(`web-chat:${conv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conv.id}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage
          setMessages((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conv?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending || !conv) return
    setInput('')
    setSending(true)
    try {
      const msg = await apiFetch<ChatMessage>(`/conversations/${conv.id}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ content: text, type: 'text' }),
      })
      setMessages((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]))
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <p className="text-sm text-neutral-500 mb-4">
          Envie mensagens diretas ao aluno. Ele recebe notificação no app.
        </p>
        <Button variant="outline" onClick={openChat} disabled={loading} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          {loading ? 'Carregando...' : 'Abrir chat'}
        </Button>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col"
      style={{ height: 400 }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-8">Nenhuma mensagem ainda.</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === userId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-neutral-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void sendMessage()
            }
          }}
          placeholder="Mensagem..."
          maxLength={4000}
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button size="icon" onClick={sendMessage} disabled={!input.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
