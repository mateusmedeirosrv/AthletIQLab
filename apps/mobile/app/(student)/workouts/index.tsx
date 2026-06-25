import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { WorkoutCard } from '../../../components/WorkoutCard'
import { useWorkouts } from '../../../hooks/useWorkouts'
import { t } from '../../../lib/i18n'
import { useBrand } from '../../../context/brand'

export default function WorkoutsScreen() {
  const { data: workouts, isLoading, isError } = useWorkouts()
  const router = useRouter()
  const { primaryColor } = useBrand()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>{t('workouts.title', 'Meus Treinos')}</Text>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {t('workouts.error', 'Erro ao carregar treinos. Tente novamente.')}
          </Text>
        </View>
      )}

      {!isLoading && !isError && workouts?.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {t('workouts.empty', 'Nenhum treino atribuído ainda.\nAguarde seu profissional.')}
          </Text>
        </View>
      )}

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() => router.push(`/(student)/workouts/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  heading: { fontSize: 24, fontWeight: '700', color: '#111827', padding: 16, paddingBottom: 8 },
  list: { paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
})
