import { useMemo, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { t } from '../lib/i18n'
import { useBrand } from '../context/brand'

interface Props {
  durationMin: number
  totalVolumeKg: number
  onComplete: (opts: { rpe?: number; clientNotes?: string }) => Promise<void>
}

const RPE_OPTIONS = [6, 7, 8, 9, 10]

export function SessionSummary({ durationMin, totalVolumeKg, onComplete }: Props) {
  const [rpe, setRpe] = useState<number | undefined>()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { primaryColor } = useBrand()
  const styles = useMemo(() => createStyles(primaryColor), [primaryColor])

  async function handleFinish() {
    setLoading(true)
    const opts: { rpe?: number; clientNotes?: string } = {}
    if (rpe !== undefined) opts.rpe = rpe
    const trimmed = notes.trim()
    if (trimmed) opts.clientNotes = trimmed
    try {
      await onComplete(opts)
    } catch {
      Alert.alert(
        t('session.errorTitle', 'Erro'),
        t('session.errorEnd', 'Não foi possível salvar o treino.'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('session.done', 'Treino concluído!')}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{durationMin}</Text>
          <Text style={styles.statLabel}>{t('session.minutes', 'min')}</Text>
        </View>
        {totalVolumeKg > 0 && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(totalVolumeKg)}</Text>
            <Text style={styles.statLabel}>{t('session.volume', 'kg total')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionLabel}>{t('session.rpe', 'Esforço percebido (RPE)')}</Text>
      <View style={styles.rpeRow}>
        {RPE_OPTIONS.map((val) => (
          <TouchableOpacity
            key={val}
            style={[styles.rpeBtn, rpe === val && styles.rpeBtnActive]}
            onPress={() => setRpe(val)}
          >
            <Text style={[styles.rpeBtnText, rpe === val && styles.rpeBtnTextActive]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>{t('session.notes', 'Anotações (opcional)')}</Text>
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder={t('session.notesPlaceholder', 'Como foi o treino?')}
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity
        style={[styles.finishButton, loading && styles.finishButtonDisabled]}
        onPress={handleFinish}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.finishText}>{t('session.finish', 'Concluir')}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function createStyles(color: string) {
  return StyleSheet.create({
    container: { padding: 24, gap: 16, backgroundColor: '#fff', flexGrow: 1 },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: '#111827',
      textAlign: 'center',
      marginBottom: 8,
    },
    statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 8 },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 36, fontWeight: '800', color },
    statLabel: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
    rpeRow: { flexDirection: 'row', gap: 8 },
    rpeBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
    },
    rpeBtnActive: { backgroundColor: color, borderColor: color },
    rpeBtnText: { fontSize: 16, fontWeight: '700', color: '#374151' },
    rpeBtnTextActive: { color: '#fff' },
    notesInput: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: '#111827',
      minHeight: 80,
      textAlignVertical: 'top',
    },
    finishButton: {
      backgroundColor: '#16A34A',
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    finishButtonDisabled: { opacity: 0.6 },
    finishText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  })
}
