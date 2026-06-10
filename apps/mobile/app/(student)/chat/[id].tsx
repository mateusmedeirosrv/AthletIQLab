import { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { apiClient } from '../../../lib/api'
import { useAuth } from '../../../context/auth'
import { useConversation, type ChatMessage } from '../../../hooks/useConversations'
import { t } from '../../../lib/i18n'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: conv, isLoading } = useConversation(id)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList<ChatMessage>>(null)

  // Seed local state from initial query
  useEffect(() => {
    if (conv?.messages) {
      setMessages(conv.messages)
    }
  }, [conv?.messages])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          // Scroll to bottom
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    try {
      const res = await apiClient.post<ChatMessage>(`/conversations/${id}/messages`, {
        content: text,
        type: 'text',
      })
      // Optimistically add our own message if Realtime hasn't fired yet
      setMessages((prev) => (prev.find((m) => m.id === res.data.id) ? prev : [...prev, res.data]))
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.id
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
          {item.content}
        </Text>
        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('chat.personal', 'Seu personal')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{t('common.loading', 'Carregando...')}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t('chat.placeholder', 'Mensagem...')}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={4000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || sending}
            >
              <Text style={styles.sendBtnText}>{'›'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  backBtn: { marginRight: 8 },
  backText: { fontSize: 28, color: '#2563EB', lineHeight: 32 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: 15, color: '#9CA3AF' },
  messageList: { padding: 16, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  bubbleMe: { backgroundColor: '#2563EB', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#111827' },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeThem: { color: '#9CA3AF' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#93C5FD' },
  sendBtnText: { fontSize: 24, color: '#fff', lineHeight: 28 },
})
