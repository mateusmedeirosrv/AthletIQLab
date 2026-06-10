import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Svg, { Circle } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  seconds: number
  onComplete: () => void
  onSkip: () => void
}

export function RestTimer({ seconds, onComplete, onSkip }: Props) {
  const [remaining, setRemaining] = useState(seconds)
  const progress = useSharedValue(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    progress.value = withTiming(0, { duration: seconds * 1000, easing: Easing.linear })

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }))

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Descanso</Text>

      <Svg width={130} height={130} viewBox="0 0 130 130">
        <Circle cx={65} cy={65} r={RADIUS} stroke="#374151" strokeWidth={8} fill="none" />
        <AnimatedCircle
          cx={65}
          cy={65}
          r={RADIUS}
          stroke="#2563EB"
          strokeWidth={8}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin="65, 65"
        />
      </Svg>

      <Text style={styles.time}>{remaining}s</Text>

      <TouchableOpacity style={styles.skip} onPress={onSkip}>
        <Text style={styles.skipText}>Pular descanso</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 24 },
  label: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  time: {
    position: 'absolute',
    top: '50%',
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
  },
  skip: { marginTop: 16 },
  skipText: { color: '#9CA3AF', fontSize: 14 },
})
