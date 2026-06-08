'use client'

import { useReducer, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { ConversationMessage, AiChatWorkoutProposal } from '@athletiqlab/shared'
import { MessageBubble } from './MessageBubble'
import { WorkoutProposalPreview } from './WorkoutProposalPreview'
import { ChatInput } from './ChatInput'

// ── State machine ─────────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'starting'
  | 'active'
  | 'sending'
  | 'awaiting_auth'
  | 'authorizing'
  | 'authorized'
  | 'error'

interface ChatState {
  phase: Phase
  conversationId: string | null
  messages: ConversationMessage[]
  proposedWorkout: AiChatWorkoutProposal | null
  resultingWorkoutId: string | null
  inputValue: string
  error: string | null
}

type Action =
  | { type: 'START' }
  | { type: 'STARTED'; conversationId: string; firstMessage: ConversationMessage }
  | { type: 'SEND' }
  | { type: 'USER_MESSAGE_SENT'; message: ConversationMessage }
  | {
      type: 'AI_REPLIED'
      message: ConversationMessage
      proposedWorkout: AiChatWorkoutProposal | null
      conversationStatus: string
    }
  | { type: 'AUTHORIZE' }
  | { type: 'AUTHORIZED'; workoutId: string }
  | { type: 'DISCARD' }
  | { type: 'DISCARDED' }
  | { type: 'CONTINUE_ADJUSTING' }
  | { type: 'INPUT_CHANGE'; value: string }
  | { type: 'QUICK_REPLY'; value: string; label: string }
  | { type: 'ERROR'; message: string }

const initialState: ChatState = {
  phase: 'idle',
  conversationId: null,
  messages: [],
  proposedWorkout: null,
  resultingWorkoutId: null,
  inputValue: '',
  error: null,
}

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'starting', error: null }

    case 'STARTED':
      return {
        ...state,
        phase: 'active',
        conversationId: action.conversationId,
        messages: [action.firstMessage],
      }

    case 'SEND':
      return { ...state, phase: 'sending', error: null }

    case 'USER_MESSAGE_SENT':
      return {
        ...state,
        messages: [...state.messages, action.message],
        inputValue: '',
      }

    case 'AI_REPLIED': {
      const nextPhase =
        action.conversationStatus === 'awaiting_authorization' ? 'awaiting_auth' : 'active'
      return {
        ...state,
        phase: nextPhase,
        messages: [...state.messages, action.message],
        proposedWorkout: action.proposedWorkout,
      }
    }

    case 'AUTHORIZE':
      return { ...state, phase: 'authorizing', error: null }

    case 'AUTHORIZED':
      return { ...state, phase: 'authorized', resultingWorkoutId: action.workoutId }

    case 'DISCARD':
    case 'DISCARDED':
      return { ...initialState }

    case 'CONTINUE_ADJUSTING':
      return { ...state, phase: 'active', proposedWorkout: null }

    case 'INPUT_CHANGE':
      return { ...state, inputValue: action.value }

    case 'QUICK_REPLY':
      return { ...state, inputValue: action.value }

    case 'ERROR':
      return { ...state, phase: 'error', error: action.message }

    default:
      return state
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatWorkoutCreation({ token }: { token: string }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const inFlight =
    state.phase === 'starting' || state.phase === 'sending' || state.phase === 'authorizing'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  // Start conversation automatically on mount (token is stable for the session)
  useEffect(() => {
    void handleStart()
  }, []) // intentional empty deps — handleStart uses token from closure which is session-stable

  async function handleStart() {
    dispatch({ type: 'START' })
    try {
      const res = await api.post<{
        data: { conversationId: string; message: ConversationMessage }
      }>('/ai/workout-chat/start', {}, token)
      dispatch({
        type: 'STARTED',
        conversationId: res.data.conversationId,
        firstMessage: res.data.message,
      })
    } catch (err) {
      dispatch({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Erro ao iniciar conversa',
      })
    }
  }

  async function handleSend() {
    const content = state.inputValue.trim()
    if (!content || !state.conversationId || inFlight) return

    // Optimistically add user message to UI
    const tempUserMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      quickReplies: null,
      selectedQuickReply: null,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'SEND' })
    dispatch({ type: 'USER_MESSAGE_SENT', message: tempUserMsg })

    try {
      const res = await api.post<{
        data: {
          message: ConversationMessage
          readyToPropose: boolean
          proposedWorkout: AiChatWorkoutProposal | null
          conversationStatus: string
        }
      }>(`/ai/workout-chat/${state.conversationId}/message`, { content }, token)

      dispatch({
        type: 'AI_REPLIED',
        message: res.data.message,
        proposedWorkout: res.data.proposedWorkout,
        conversationStatus: res.data.conversationStatus,
      })
    } catch (err) {
      dispatch({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Erro ao enviar mensagem',
      })
    }
  }

  async function handleQuickReply(value: string, label: string) {
    dispatch({ type: 'QUICK_REPLY', value, label })
    // Immediately send the quick reply value
    const content = value.trim()
    if (!content || !state.conversationId || inFlight) return

    const tempUserMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: label, // show label in UI
      quickReplies: null,
      selectedQuickReply: null,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'SEND' })
    dispatch({ type: 'USER_MESSAGE_SENT', message: tempUserMsg })

    try {
      const res = await api.post<{
        data: {
          message: ConversationMessage
          readyToPropose: boolean
          proposedWorkout: AiChatWorkoutProposal | null
          conversationStatus: string
        }
      }>(
        `/ai/workout-chat/${state.conversationId}/message`,
        { content, selectedQuickReply: label },
        token,
      )

      dispatch({
        type: 'AI_REPLIED',
        message: res.data.message,
        proposedWorkout: res.data.proposedWorkout,
        conversationStatus: res.data.conversationStatus,
      })
    } catch (err) {
      dispatch({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Erro ao enviar resposta',
      })
    }
  }

  async function handleAuthorize() {
    if (!state.conversationId) return
    dispatch({ type: 'AUTHORIZE' })
    try {
      const res = await api.post<{ data: { workoutId: string } }>(
        `/ai/workout-chat/${state.conversationId}/authorize`,
        {},
        token,
      )
      dispatch({ type: 'AUTHORIZED', workoutId: res.data.workoutId })
    } catch (err) {
      dispatch({
        type: 'ERROR',
        message: err instanceof Error ? err.message : 'Erro ao autorizar treino',
      })
    }
  }

  async function handleDiscard() {
    if (state.conversationId && state.phase !== 'idle') {
      try {
        await api.post(`/ai/workout-chat/${state.conversationId}/discard`, {}, token)
      } catch {
        // ignore — still reset UI
      }
    }
    dispatch({ type: 'DISCARDED' })
    void handleStart()
  }

  async function handleContinueAdjusting() {
    if (!state.conversationId) return
    dispatch({ type: 'CONTINUE_ADJUSTING' })
    try {
      await api.post(`/ai/workout-chat/${state.conversationId}/refine`, {}, token)
    } catch {
      // ignore — UI is already in active state
    }
  }

  // Authorized — show success and navigate
  if (state.phase === 'authorized' && state.resultingWorkoutId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="rounded-full bg-green-100 p-4">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-neutral-900">Treino criado com sucesso!</p>
          <p className="mt-1 text-sm text-neutral-500">
            O treino foi salvo como rascunho e está pronto para publicar.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: 'DISCARDED' })
              void handleStart()
            }}
          >
            Criar outro treino
          </Button>
          <Button
            onClick={() =>
              router.push(
                `/dashboard/workouts/${state.resultingWorkoutId}` as `/dashboard/workouts/${string}`,
              )
            }
          >
            Ver treino salvo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
      {/* Toolbar */}
      {state.conversationId && state.phase !== 'idle' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleDiscard()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Descartar conversa
          </button>
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        {state.phase === 'starting' || state.phase === 'idle' ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando conversa...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {state.messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLatest={i === state.messages.length - 1}
                onQuickReply={(value, label) => void handleQuickReply(value, label)}
                disabled={inFlight}
              />
            ))}

            {inFlight && state.phase !== 'authorizing' && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-sm ring-1 ring-neutral-200">
                  <span className="text-sm text-neutral-400">Digitando...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
          <button
            type="button"
            onClick={() => dispatch({ type: 'ERROR', message: '' })}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Workout proposal preview */}
      {(state.phase === 'awaiting_auth' || state.phase === 'authorizing') &&
        state.proposedWorkout && (
          <WorkoutProposalPreview
            proposal={state.proposedWorkout}
            onAuthorize={() => void handleAuthorize()}
            onContinueAdjusting={() => void handleContinueAdjusting()}
            loading={inFlight}
          />
        )}

      {/* Input area */}
      {(state.phase === 'active' || state.phase === 'sending') && (
        <ChatInput
          value={state.inputValue}
          onChange={(v) => dispatch({ type: 'INPUT_CHANGE', value: v })}
          onSend={() => void handleSend()}
          disabled={inFlight}
        />
      )}
    </div>
  )
}
