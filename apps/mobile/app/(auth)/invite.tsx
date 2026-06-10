import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/auth'
import { apiClient } from '../../lib/api'
import { t } from '../../lib/i18n'

export default function InviteScreen() {
  const { refreshStudentProfile } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    const code = inviteCode.trim().toUpperCase()
    const trimmedName = name.trim()
    if (!code || !trimmedName) {
      Alert.alert(t('invite.error', 'Preencha o código e seu nome'))
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/students/invites/accept', { inviteCode: code, name: trimmedName })
      await refreshStudentProfile()
      // NavigationGuard handles the redirect after profile is set
    } catch (err) {
      Alert.alert(
        t('invite.errorTitle', 'Código inválido'),
        err instanceof Error ? err.message : t('invite.errorGeneric', 'Tente novamente.'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>{t('invite.title', 'Código de convite')}</Text>
        <Text style={styles.subtitle}>
          {t('invite.subtitle', 'Peça o código para seu profissional e insira abaixo.')}
        </Text>

        <TextInput
          style={styles.input}
          placeholder={t('invite.namePlaceholder', 'Seu nome completo')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder={t('invite.codePlaceholder', 'Ex: A1B2C3D4')}
          value={inviteCode}
          onChangeText={(v) => setInviteCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleAccept}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleAccept} activeOpacity={0.85}>
            <Text style={styles.buttonText}>{t('invite.confirm', 'Confirmar')}</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  codeInput: { letterSpacing: 4, fontWeight: '700', fontSize: 20 },
  loader: { marginTop: 8 },
  button: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
