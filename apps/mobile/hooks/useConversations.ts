import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export interface Conversation {
  id: string
  personalId: string
  studentId: string
  lastMessageAt: string | null
  createdAt: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: string
  attachmentUrl: string | null
  readAt: string | null
  createdAt: string
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[]
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get<Conversation[]>('/conversations').then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => apiClient.get<ConversationDetail>(`/conversations/${id}`).then((r) => r.data),
    staleTime: 0,
    refetchInterval: false,
  })
}
