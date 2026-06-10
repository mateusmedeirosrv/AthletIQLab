import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { apiClient } from '../lib/api'
import { trackEvent } from '../lib/analytics'

interface NpsWidgetProps {
  trigger: string
  visible: boolean
  onDismiss: () => void
}

export function NpsWidget({ trigger, visible, onDismiss }: NpsWidgetProps) {
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function submit() {
    if (score === null) return
    setLoading(true)
    try {
      await apiClient.post('/feedback/nps', {
        score,
        comment: comment.trim() || undefined,
        trigger,
      })
      void trackEvent('nps_submitted', { score, trigger })
      setSubmitted(true)
      setTimeout(onDismiss, 1500)
    } catch {
      // Silent — don't block UX on NPS failure
      onDismiss()
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    void trackEvent('nps_dismissed', { trigger })
    onDismiss()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {submitted ? (
            <View style={styles.thankYou}>
              <Text style={styles.thankYouEmoji}>🙏</Text>
              <Text style={styles.thankYouText}>Obrigado pelo feedback!</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Você recomendaria o AthletiQLab?</Text>
              <Text style={styles.subtitle}>De 0 (improvável) a 10 (com certeza)</Text>

              <View style={styles.scores}>
                {Array.from({ length: 11 }, (_, i) => (
                  <Pressable
                    key={i}
                    style={[styles.scoreBtn, score === i && styles.scoreBtnActive]}
                    onPress={() => setScore(i)}
                  >
                    <Text style={[styles.scoreLabel, score === i && styles.scoreLabelActive]}>
                      {i}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {score !== null && (
                <TextInput
                  style={styles.input}
                  placeholder="Comentário opcional..."
                  placeholderTextColor="#9CA3AF"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={3}
                />
              )}

              <View style={styles.actions}>
                <Pressable style={styles.dismissBtn} onPress={dismiss}>
                  <Text style={styles.dismissText}>Agora não</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.submitBtn,
                    (score === null || loading) && styles.submitBtnDisabled,
                  ]}
                  onPress={submit}
                  disabled={score === null || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Enviar</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  scores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  scoreLabelActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 72,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  thankYou: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  thankYouEmoji: {
    fontSize: 36,
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
})
