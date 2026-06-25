import { useMemo } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useConversations } from '../../../hooks/useConversations'
import { t } from '../../../lib/i18n'
import { useBrand } from '../../../context/brand'

export default function ChatListScreen() {
  const router = useRouter()
  const { data: conversations, isLoading } = useConversations()
  const { primaryColor } = useBrand()
  const styles = useMemo(() => createStyles(primaryColor), [primaryColor])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>{t('chat.title', 'Mensagens')}</Text>
        <View style={styles.center}>
          <Text style={styles.muted}>{t('common.loading', 'Carregando...')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>{t('chat.title', 'Mensagens')}</Text>
        <View style={styles.center}>
          <Text style={styles.muted}>
            {t('chat.empty', 'Nenhuma conversa ainda. Seu personal entrará em contato aqui.')}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>{t('chat.title', 'Mensagens')}</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const date = item.lastMessageAt
            ? new Date(item.lastMessageAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })
            : ''
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                router.push(`/(student)/chat/${item.id}` as `/(student)/chat/${string}`)
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>P</Text>
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{t('chat.personal', 'Seu personal')}</Text>
                {date ? <Text style={styles.rowDate}>{date}</Text> : null}
              </View>
            </TouchableOpacity>
          )
        }}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

function createStyles(color: string) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    heading: { fontSize: 24, fontWeight: '700', color: '#111827', padding: 16, paddingBottom: 8 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    muted: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
    list: { paddingHorizontal: 16, paddingBottom: 16 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    rowDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  })
}
