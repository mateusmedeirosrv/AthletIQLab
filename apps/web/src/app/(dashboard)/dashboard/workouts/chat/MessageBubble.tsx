import { Bot, User } from 'lucide-react'
import type { ConversationMessage } from '@athletiqlab/shared'
import { QuickReplies } from './QuickReplies'

interface MessageBubbleProps {
  message: ConversationMessage
  isLatest: boolean
  onQuickReply: (value: string, label: string) => void
  disabled: boolean
}

export function MessageBubble({ message, isLatest, onQuickReply, disabled }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isAssistant ? 'bg-blue-100 text-blue-600' : 'bg-neutral-200 text-neutral-600'
        }`}
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div
        className={`flex max-w-[80%] flex-col gap-2 ${isAssistant ? 'items-start' : 'items-end'}`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isAssistant
              ? 'rounded-tl-sm bg-white text-neutral-800 shadow-sm ring-1 ring-neutral-200'
              : 'rounded-tr-sm bg-blue-600 text-white'
          }`}
        >
          {message.content}
        </div>

        {isAssistant && isLatest && message.quickReplies && message.quickReplies.length > 0 && (
          <QuickReplies
            replies={message.quickReplies}
            onSelect={onQuickReply}
            disabled={disabled}
            selectedValue={message.selectedQuickReply}
          />
        )}
      </div>
    </div>
  )
}
