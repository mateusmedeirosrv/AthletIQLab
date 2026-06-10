import { useRef, useState } from 'react'
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useWorkout } from '../../../../hooks/useWorkouts'
import { useSession } from '../../../../hooks/useSession'
import { ExercisePage } from '../../../../components/ExercisePage'
import { SessionSummary } from '../../../../components/SessionSummary'
import { t } from '../../../../lib/i18n'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: workout } = useWorkout(id)
  const { exerciseStates, logSet, skipExercise, endSession } = useSession()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [startTime] = useState(() => Date.now())

  const exercises = workout?.exercises.sort((a, b) => a.order - b.order) ?? []

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setCurrentIndex(viewableItems[0].index)
    }
  }).current

  function handleAbandon() {
    Alert.alert(
      t('player.abandonTitle', 'Abandonar treino?'),
      t('player.abandonMessage', 'O progresso será perdido.'),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: t('player.abandon', 'Abandonar'),
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    )
  }

  function handleFinishPlayer() {
    setShowSummary(true)
  }

  async function handleSessionComplete(opts: { rpe?: number; clientNotes?: string }) {
    await endSession(opts)
    router.replace('/(student)/workouts')
  }

  if (!workout || exercises.length === 0) return null

  const durationMin = Math.round((Date.now() - startTime) / 60_000)
  const totalVolumeKg = Object.values(exerciseStates).reduce((sum, es) => {
    for (let i = 0; i < es.completedSets; i++) {
      sum += (es.repsPerSet[i] ?? 0) * (es.loadPerSet[i] ?? 0)
    }
    return sum
  }, 0)

  return (
    <View style={styles.container}>
      {/* Abandon button */}
      <SafeAreaView style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity onPress={handleAbandon} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>
          {currentIndex + 1} / {exercises.length}
        </Text>
      </SafeAreaView>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <ExercisePage
            item={item}
            isActive={index === currentIndex}
            completedSets={exerciseStates[item.id]?.completedSets ?? 0}
            onSetComplete={(reps, load) => logSet(item.id, reps, load)}
            onSkip={() => skipExercise(item.id)}
          />
        )}
        ListFooterComponent={
          <View style={[styles.finishPage, { height: SCREEN_HEIGHT }]}>
            <Text style={styles.finishEmoji}>🏁</Text>
            <Text style={styles.finishText}>{t('player.allDone', 'Todos os exercícios!')}</Text>
            <TouchableOpacity style={styles.finishButton} onPress={handleFinishPlayer}>
              <Text style={styles.finishButtonText}>{t('player.finish', 'Finalizar treino')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={showSummary} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <SessionSummary
            durationMin={durationMin}
            totalVolumeKg={totalVolumeKg}
            onComplete={handleSessionComplete}
          />
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  counter: { color: '#fff', fontSize: 14, fontWeight: '600' },
  finishPage: {
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  finishEmoji: { fontSize: 56 },
  finishText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  finishButton: {
    marginTop: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  finishButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})
