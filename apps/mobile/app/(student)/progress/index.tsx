import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { t } from '../../../lib/i18n'

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>{t('progress.title', 'Progresso')}</Text>
      <View style={styles.center}>
        <Text style={styles.placeholder}>
          {t('progress.soon', 'Em breve: gráficos de evolução, histórico de cargas e frequência.')}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  heading: { fontSize: 24, fontWeight: '700', color: '#111827', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  placeholder: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
})
