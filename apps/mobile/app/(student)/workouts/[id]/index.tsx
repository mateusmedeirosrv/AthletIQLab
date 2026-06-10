import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator } from 'react-native'
import { useWorkout } from '../../../../hooks/useWorkouts'
import { useSession } from '../../../../hooks/useSession'
import { t } from '../../../../lib/i18n'

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: workout, isLoading } = useWorkout(id)
  const { startSession } = useSession()

  async function handleStart() {
    try {
      const sessionId = await startSession(id)
      router.push(`/(student)/workouts/${id}/player?sessionId=${sessionId}`)
    } catch {
      Alert.alert(
        t('session.errorTitle', 'Erro'),
        t('session.errorStart', 'Não foi possível iniciar o treino.'),
      )
    }
  }

  if (isLoading || !workout) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← {t('common.back', 'Voltar')}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{workout.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{workout.modality}</Text>
          </View>
          {workout.estimatedDurationMin ? (
            <Text style={styles.meta}>{workout.estimatedDurationMin} min</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>
          {workout.exercises.length} {t('workouts.exercises', 'exercícios')}
        </Text>

        {workout.exercises
          .sort((a, b) => a.order - b.order)
          .map((ex) => (
            <View key={ex.id} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
              <Text style={styles.exerciseDetail}>
                {ex.sets}x · {ex.reps}
                {ex.load ? ` · ${ex.load}` : ''}
              </Text>
            </View>
          ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startText}>{t('workouts.start', 'Iniciar treino')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { padding: 16, paddingBottom: 0 },
  backText: { color: '#2563EB', fontSize: 15 },
  content: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  badge: { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  meta: { fontSize: 14, color: '#6B7280' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12 },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  exerciseName: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  exerciseDetail: { fontSize: 13, color: '#6B7280' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  startText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})
