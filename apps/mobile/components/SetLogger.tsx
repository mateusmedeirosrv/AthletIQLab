import { useState } from 'react'
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import * as Haptics from 'expo-haptics'

interface Props {
  totalSets: number
  completedSets: number
  plannedReps: string
  plannedLoad: string | null
  onSetComplete: (reps: number, load: number) => void
  onAllSetsComplete: () => void
}

export function SetLogger({
  totalSets,
  completedSets,
  plannedReps,
  plannedLoad,
  onSetComplete,
  onAllSetsComplete,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false)
  const [repsInput, setRepsInput] = useState('')
  const [loadInput, setLoadInput] = useState('')

  const isLastSet = completedSets === totalSets - 1
  const allDone = completedSets >= totalSets

  function openModal() {
    // Pre-fill with planned values
    const repsNum = parseInt(plannedReps.split('-')[0] ?? plannedReps, 10)
    setRepsInput(isNaN(repsNum) ? '' : String(repsNum))
    setLoadInput(plannedLoad?.replace(/[^0-9.]/g, '') ?? '')
    setModalVisible(true)
  }

  function confirmSet() {
    const reps = parseInt(repsInput, 10) || 0
    const load = parseFloat(loadInput) || 0
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onSetComplete(reps, load)
    setModalVisible(false)
    if (isLastSet) {
      onAllSetsComplete()
    }
  }

  // Set indicator dots
  const dots = Array.from({ length: totalSets }, (_, i) => i < completedSets)

  return (
    <View style={styles.container}>
      {/* Set dots */}
      <View style={styles.dots}>
        {dots.map((done, i) => (
          <View key={i} style={[styles.dot, done && styles.dotDone]} />
        ))}
      </View>

      {allDone ? (
        <View style={styles.doneBadge}>
          <Text style={styles.doneText}>Série concluída!</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={openModal} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{completedSets + 1}ª série — Concluir</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              Série {completedSets + 1} de {totalSets}
            </Text>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Reps</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={repsInput}
                  onChangeText={setRepsInput}
                  keyboardType="number-pad"
                  placeholder={plannedReps}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Carga (kg)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={loadInput}
                  onChangeText={setLoadInput}
                  keyboardType="decimal-pad"
                  placeholder={plannedLoad ?? '—'}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={confirmSet}>
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#374151' },
  dotDone: { backgroundColor: '#2563EB' },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  doneBadge: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 16 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: '#6B7280', fontSize: 15 },
})
