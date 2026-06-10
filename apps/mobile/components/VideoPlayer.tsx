import { StyleSheet, View, Image } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useEffect } from 'react'

interface Props {
  uri: string | null
  thumbnailUrl: string | null
  isActive: boolean
}

export function VideoPlayer({ uri, thumbnailUrl, isActive }: Props) {
  const player = useVideoPlayer(uri ?? '', (p) => {
    p.loop = true
    p.muted = true
  })

  useEffect(() => {
    if (!uri) return
    if (isActive) {
      player.play()
    } else {
      player.pause()
    }
  }, [isActive, uri])

  if (!uri) {
    return (
      <View style={styles.placeholder}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noVideo]} />
        )}
      </View>
    )
  }

  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  )
}

const styles = StyleSheet.create({
  placeholder: { ...StyleSheet.absoluteFillObject },
  noVideo: { backgroundColor: '#1F2937' },
})
