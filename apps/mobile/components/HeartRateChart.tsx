import { Dimensions, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg'
import type { HRSample } from '../modules/health-kit'

const SCREEN_W = Dimensions.get('window').width
const CHART_H = 100
const PADDING_H = 40 // left axis
const PADDING_RIGHT = 8
const CHART_W = SCREEN_W - PADDING_H - PADDING_RIGHT - 32 // 32 = outer horizontal padding

function buildPath(samples: HRSample[], minBpm: number, maxBpm: number): string {
  if (samples.length === 0) return ''
  const range = maxBpm - minBpm || 1
  return samples
    .map((s, i) => {
      const x = (i / (samples.length - 1)) * CHART_W
      const y = CHART_H - ((s.bpm - minBpm) / range) * CHART_H
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

interface HeartRateChartProps {
  samples: HRSample[]
  avgBpm: number | null
  maxBpm: number | null
}

export function HeartRateChart({ samples, avgBpm, maxBpm }: HeartRateChartProps) {
  if (samples.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem dados de FC para esta sessão</Text>
      </View>
    )
  }

  const bpms = samples.map((s) => s.bpm)
  const minBpm = Math.min(...bpms)
  const maxBpmVal = Math.max(...bpms)

  const path = buildPath(samples, minBpm, maxBpmVal)

  // Downsample to ~60 points for the dot overlay (avoid too many SVG elements)
  const step = Math.max(1, Math.floor(samples.length / 30))
  const dotSamples = samples.filter((_, i) => i % step === 0)
  const range = maxBpmVal - minBpm || 1

  return (
    <View style={styles.container}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{avgBpm ?? '—'}</Text>
          <Text style={styles.statLabel}>FC média (bpm)</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{maxBpm ?? '—'}</Text>
          <Text style={styles.statLabel}>FC máxima (bpm)</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chart}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{maxBpmVal}</Text>
          <Text style={styles.axisLabel}>{Math.round((maxBpmVal + minBpm) / 2)}</Text>
          <Text style={styles.axisLabel}>{minBpm}</Text>
        </View>

        <Svg width={CHART_W} height={CHART_H + 4}>
          {/* Horizontal grid lines */}
          {[0, 0.5, 1].map((pct) => (
            <Line
              key={pct}
              x1={0}
              y1={(pct * CHART_H).toFixed(1)}
              x2={CHART_W}
              y2={(pct * CHART_H).toFixed(1)}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
          ))}

          {/* HR line */}
          <Path d={path} stroke="#EF4444" strokeWidth={2} fill="none" strokeLinejoin="round" />

          {/* Dots */}
          {dotSamples.map((s, i) => {
            const idx = samples.indexOf(s)
            const x = (idx / (samples.length - 1)) * CHART_W
            const y = CHART_H - ((s.bpm - minBpm) / range) * CHART_H
            return <Circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={2} fill="#EF4444" />
          })}

          {/* Avg line */}
          {avgBpm && (
            <Line
              x1={0}
              y1={(CHART_H - ((avgBpm - minBpm) / range) * CHART_H).toFixed(1)}
              x2={CHART_W}
              y2={(CHART_H - ((avgBpm - minBpm) / range) * CHART_H).toFixed(1)}
              stroke="#F97316"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}

          {/* Time label (first + last) */}
          {samples.length > 1 && (
            <>
              <SvgText x={0} y={CHART_H + 12} fontSize={9} fill="#9CA3AF">
                {new Date(samples[0]!.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </SvgText>
              <SvgText x={CHART_W} y={CHART_H + 12} fontSize={9} fill="#9CA3AF" textAnchor="end">
                {new Date(samples[samples.length - 1]!.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </SvgText>
            </>
          )}
        </Svg>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  empty: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#9CA3AF' },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  yAxis: {
    width: PADDING_H - 8,
    height: CHART_H,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  axisLabel: { fontSize: 9, color: '#9CA3AF' },
})
