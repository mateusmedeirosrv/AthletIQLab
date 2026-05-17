// i18n stub — all UI strings pass through t() so adding 'en' locale later requires minimal changes
const ptBR: Record<string, string> = {}

export function t(key: string, fallback?: string): string {
  return ptBR[key] ?? fallback ?? key
}
