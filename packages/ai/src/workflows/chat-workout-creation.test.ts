import { describe, it, expect, vi } from 'vitest'

// Mock DB and OpenAI so module-level initialization doesn't fail in unit tests
vi.mock('@athletiqlab/db', () => ({ db: {}, aiUsageLog: {} }))
vi.mock('openai', () => ({ default: vi.fn() }))

import {
  extractQuickReplies,
  extractReadyToPropose,
  buildMessagesArray,
} from './chat-workout-creation'

describe('extractQuickReplies', () => {
  it('returns empty array when no QR block present', () => {
    const { cleanContent, quickReplies } = extractQuickReplies('Olá! Qual modalidade?')
    expect(cleanContent).toBe('Olá! Qual modalidade?')
    expect(quickReplies).toEqual([])
  })

  it('extracts quick replies and strips the block from content', () => {
    const input =
      'Qual o objetivo?<!--QR:[{"label":"Hipertrofia","value":"hipertrofia"},{"label":"Emagrecimento","value":"emagrecimento"}]-->'
    const { cleanContent, quickReplies } = extractQuickReplies(input)
    expect(cleanContent).toBe('Qual o objetivo?')
    expect(quickReplies).toHaveLength(2)
    expect(quickReplies[0]).toEqual({ label: 'Hipertrofia', value: 'hipertrofia' })
    expect(quickReplies[1]).toEqual({ label: 'Emagrecimento', value: 'emagrecimento' })
  })

  it('ignores malformed JSON in QR block', () => {
    const input = 'Pergunta<!--QR:not valid json-->'
    const { cleanContent, quickReplies } = extractQuickReplies(input)
    expect(cleanContent).toBe('Pergunta')
    expect(quickReplies).toEqual([])
  })

  it('filters items missing label or value', () => {
    const input = 'Texto<!--QR:[{"label":"OK","value":"ok"},{"only":"label"}]-->'
    const { quickReplies } = extractQuickReplies(input)
    expect(quickReplies).toHaveLength(1)
    expect(quickReplies[0]?.label).toBe('OK')
  })
})

describe('extractReadyToPropose', () => {
  it('returns readyToPropose=false when sentinel absent', () => {
    const { cleanContent, readyToPropose } = extractReadyToPropose('Alguma pergunta?')
    expect(cleanContent).toBe('Alguma pergunta?')
    expect(readyToPropose).toBe(false)
  })

  it('returns readyToPropose=true and strips sentinel', () => {
    const input = 'Entendi tudo que preciso.\n[READY_TO_PROPOSE]'
    const { cleanContent, readyToPropose } = extractReadyToPropose(input)
    expect(readyToPropose).toBe(true)
    expect(cleanContent).toBe('Entendi tudo que preciso.')
    expect(cleanContent).not.toContain('[READY_TO_PROPOSE]')
  })
})

describe('buildMessagesArray', () => {
  it('places system message first', () => {
    const msgs = buildMessagesArray({
      systemContent: 'sys',
      history: [],
    })
    expect(msgs[0]).toEqual({ role: 'system', content: 'sys' })
    expect(msgs).toHaveLength(1)
  })

  it('appends history after system message', () => {
    const history = [
      { role: 'user' as const, content: 'oi' },
      { role: 'assistant' as const, content: 'olá' },
    ]
    const msgs = buildMessagesArray({ systemContent: 'sys', history })
    expect(msgs).toHaveLength(3)
    expect(msgs[1]).toEqual({ role: 'user', content: 'oi' })
    expect(msgs[2]).toEqual({ role: 'assistant', content: 'olá' })
  })

  it('appends newUserMessage as last element', () => {
    const msgs = buildMessagesArray({
      systemContent: 'sys',
      history: [{ role: 'assistant', content: 'resp' }],
      newUserMessage: 'nova pergunta',
    })
    expect(msgs[msgs.length - 1]).toEqual({ role: 'user', content: 'nova pergunta' })
  })

  it('does not append undefined newUserMessage', () => {
    const msgs = buildMessagesArray({ systemContent: 'sys', history: [] })
    expect(msgs).toHaveLength(1)
  })
})
