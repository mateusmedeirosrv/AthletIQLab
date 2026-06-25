import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Rect, Text as SvgText } from 'react-native-svg'
import { useProgress, type WeeklyBucket } from '../../../hooks/useProgress'
import { t } from '../../../lib/i18n'
import { useBrand } from '../../../context/brand'

const SCREEN_W = Dimensions.get('window').width
const CHART_PADDING = 16
const CHART_W = SCREEN_W - CHART_PADDING * 2
const BAR_GAP = 4

// ─── Bar Chart ───────────────────────────────────────────────────────────────

interface BarChartProps {
  data: WeeklyBucket[]
  valueKey: 'sessionCount' | 'totalVolumeKg'
  color: string
  height?: number
}

function BarChart({ data, valueKey, color, height = 120 }: BarChartProps) {
  const values = data.map((d) => d[valueKey] as number)
  const maxVal = Math.max(...values, 1)
  const barW = Math.max(1, (CHART_W - BAR_GAP * (data.length - 1)) / data.length)

  return (
    <Svg width={CHART_W} height={height + 24}>
      {data.map((d, i) => {
        const val = d[valueKey] as number
        const barH = (val / maxVal) * height
        const x = i * (barW + BAR_GAP)
        const y = height - barH
        const label = d.week.slice(5, 10) // MM-DD
        return (
          <Svg key={d.week}>
            <Rect x={x} y={y} width={barW} height={barH || 2} rx={3} fill={color} opacity={0.85} />
            <SvgText
              x={x + barW / 2}
              y={height + 16}
              fontSize={9}
              fill="#9CA3AF"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          </Svg>
        )
      })}
    </Svg>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { data, isLoading, isError } = useProgress()
  const { primaryColor } = useBrand()

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>{t('progress.title', 'Progresso')}</Text>
        <View style={styles.center}>
          <Text style={styles.muted}>{t('common.loading', 'Carregando...')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>{t('progress.title', 'Progresso')}</Text>
        <View style={styles.center}>
          <Text style={styles.muted}>{t('common.error', 'Erro ao carregar dados.')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const volKg = Math.round(data.totals.totalVolumeKg)
  const volLabel = volKg >= 1000 ? `${(volKg / 1000).toFixed(1)}t` : `${volKg}kg`

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>{t('progress.title', 'Progresso')}</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Totals */}
        <View style={styles.statsRow}>
          <StatCard
            label={t('progress.totalSessions', 'Treinos')}
            value={String(data.totals.totalSessions)}
          />
          <StatCard label={t('progress.totalVolume', 'Volume total')} value={volLabel} />
          <StatCard
            label={t('progress.streak', 'Semanas seguidas')}
            value={String(data.weekStreak)}
          />
        </View>

        {/* Frequency chart */}
        {data.weeklySessions.length > 0 && (
          <Section title={t('progress.frequency', 'Frequência semanal (treinos)')}>
            <BarChart data={data.weeklySessions} valueKey="sessionCount" color={primaryColor} />
          </Section>
        )}

        {/* Volume chart */}
        {data.weeklySessions.length > 0 && (
          <Section title={t('progress.volume', 'Volume semanal (kg)')}>
            <BarChart data={data.weeklySessions} valueKey="totalVolumeKg" color="#10B981" />
          </Section>
        )}

        {/* Recent sessions */}
        {data.recentSessions.length > 0 && (
          <Section title={t('progress.recentSessions', 'Últimos treinos')}>
            {data.recentSessions.map((s) => {
              const date = new Date(s.startedAt)
              const dateStr = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })
              const vol = s.totalVolumeKg ? `${Math.round(Number(s.totalVolumeKg))}kg` : '—'
              const hr = s.avgHrBpm ? `${s.avgHrBpm}bpm` : null
              return (
                <View key={s.id} style={styles.sessionRow}>
                  <Text style={styles.sessionDate}>{dateStr}</Text>
                  <Text style={styles.sessionStat}>{vol}</Text>
                  {hr && <Text style={styles.sessionStat}>{hr}</Text>}
                  {s.rpe && <Text style={styles.sessionRpe}>RPE {s.rpe}</Text>}
                </View>
              )
            })}
          </Section>
        )}

        {data.totals.totalSessions === 0 && (
          <View style={styles.center}>
            <Text style={styles.muted}>
              {t('progress.empty', 'Complete seu primeiro treino para ver estatísticas aqui.')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  heading: { fontSize: 24, fontWeight: '700', color: '#111827', padding: 16, paddingBottom: 8 },
  scroll: { paddingHorizontal: CHART_PADDING, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  muted: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24, marginTop: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  sessionDate: { fontSize: 14, fontWeight: '600', color: '#111827', width: 44 },
  sessionStat: { fontSize: 13, color: '#6B7280' },
  sessionRpe: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
})
