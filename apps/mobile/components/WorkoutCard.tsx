import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Workout } from '../hooks/useWorkouts'

interface Props {
  workout: Workout
  onPress: () => void
}

export function WorkoutCard({ workout, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {workout.title}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{workout.modality}</Text>
        </View>
      </View>
      {workout.estimatedDurationMin ? (
        <Text style={styles.meta}>{workout.estimatedDurationMin} min</Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.startLabel}>Iniciar treino →</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' },
  badge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  meta: { marginTop: 6, fontSize: 13, color: '#6B7280' },
  footer: { marginTop: 16, alignItems: 'flex-end' },
  startLabel: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
})
