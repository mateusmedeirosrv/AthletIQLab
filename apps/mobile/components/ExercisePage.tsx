import { useState } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { VideoPlayer } from './VideoPlayer'
import { SetLogger } from './SetLogger'
import { RestTimer } from './RestTimer'
import type { WorkoutExercise, Exercise } from '../hooks/useWorkouts'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

type ExercisePagePhase = 'active' | 'resting'

interface Props {
  item: WorkoutExercise & { exercise: Exercise }
  isActive: boolean
  completedSets: number
  onSetComplete: (reps: number, load: number) => void
  onSkip: () => void
}

export function ExercisePage({
  item,
  isActive,
  completedSets,
  onSetComplete,
  onSkip: _onSkip,
}: Props) {
  const [phase, setPhase] = useState<ExercisePagePhase>('active')

  function handleSetComplete(reps: number, load: number) {
    onSetComplete(reps, load)
    const next = completedSets + 1
    if (next < item.sets) {
      setPhase('resting')
    }
  }

  function handleRestComplete() {
    setPhase('active')
  }

  const restSeconds = item.restSeconds ?? 60

  return (
    <View style={styles.page}>
      {/* Background video / thumbnail */}
      <VideoPlayer
        uri={item.exercise.videoUrl}
        thumbnailUrl={item.exercise.thumbnailUrl}
        isActive={isActive && phase === 'active'}
      />

      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.gradient}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Exercise info overlay */}
      <View style={styles.overlay}>
        <View style={styles.infoBox}>
          <Text style={styles.exerciseName}>{item.exercise.name}</Text>
          <Text style={styles.exerciseMeta}>
            {item.sets}x · {item.reps}
            {item.load ? ` · ${item.load}` : ''}
            {item.restSeconds ? ` · ${item.restSeconds}s desc.` : ''}
          </Text>
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          {item.exercise.techniqueTips ? (
            <Text style={styles.tip}>{item.exercise.techniqueTips}</Text>
          ) : null}
        </View>

        {phase === 'resting' ? (
          <RestTimer
            seconds={restSeconds}
            onComplete={handleRestComplete}
            onSkip={handleRestComplete}
          />
        ) : (
          <SetLogger
            totalSets={item.sets}
            completedSets={completedSets}
            plannedReps={item.reps}
            plannedLoad={item.load}
            onSetComplete={handleSetComplete}
            onAllSetsComplete={() => {
              /* parent handles via completedSets */
            }}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    height: SCREEN_HEIGHT,
    backgroundColor: '#111827',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 48,
    paddingHorizontal: 20,
    gap: 20,
  },
  infoBox: { gap: 6 },
  exerciseName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  exerciseMeta: { fontSize: 16, color: '#E5E7EB', fontWeight: '600' },
  notes: { fontSize: 13, color: '#D1D5DB', marginTop: 2 },
  tip: { fontSize: 13, color: '#93C5FD', fontStyle: 'italic', marginTop: 2 },
})
