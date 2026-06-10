import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/auth'
import { t } from '../../lib/i18n'

export default function LoginScreen() {
  const { signInWithGoogle, loading } = useAuth()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AthletiQLab</Text>
        <Text style={styles.subtitle}>{t('login.subtitle', 'Seu treino, do jeito certo.')}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={signInWithGoogle} activeOpacity={0.85}>
            <Text style={styles.buttonText}>{t('login.google', 'Entrar com Google')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#2563EB' },
  subtitle: { marginTop: 8, fontSize: 16, color: '#6B7280', marginBottom: 48 },
  loader: { marginTop: 24 },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
