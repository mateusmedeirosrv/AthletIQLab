import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../../context/auth'
import { t } from '../../../lib/i18n'

export default function ProfileScreen() {
  const { user, studentProfile, signOut } = useAuth()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>{t('profile.title', 'Perfil')}</Text>
      <View style={styles.content}>
        <Text style={styles.name}>{studentProfile?.name ?? user?.email}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.85}>
          <Text style={styles.signOutText}>{t('profile.signOut', 'Sair')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  heading: { fontSize: 24, fontWeight: '700', color: '#111827', padding: 16 },
  content: { padding: 16, gap: 8 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 32 },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { fontSize: 16, color: '#DC2626', fontWeight: '600' },
})
