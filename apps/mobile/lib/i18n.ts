// i18n stub — same pattern as apps/web/src/lib/i18n.ts
const ptBR: Record<string, string> = {}

export function t(key: string, fallback?: string): string {
  return ptBR[key] ?? fallback ?? key
}
