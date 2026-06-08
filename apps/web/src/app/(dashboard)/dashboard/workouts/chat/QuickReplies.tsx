import type { QuickReply } from '@athletiqlab/shared'

interface QuickRepliesProps {
  replies: QuickReply[]
  onSelect: (value: string, label: string) => void
  disabled: boolean
  selectedValue: string | null
}

export function QuickReplies({ replies, onSelect, disabled, selectedValue }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {replies.map((reply) => {
        const isSelected = selectedValue === reply.value
        return (
          <button
            key={reply.value}
            type="button"
            disabled={disabled || selectedValue !== null}
            onClick={() => onSelect(reply.value, reply.label)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : selectedValue !== null
                  ? 'cursor-default border-neutral-200 text-neutral-400'
                  : 'border-neutral-300 text-neutral-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
            } disabled:cursor-not-allowed`}
          >
            {reply.label}
          </button>
        )
      })}
    </div>
  )
}
