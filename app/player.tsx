import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router, useLocalSearchParams } from 'expo-router';
import { audioService } from '../services/audioService';
import { LoadingState, ErrorState } from '../components/LoadingStates';

const { width } = Dimensions.get('window');

interface Track {
  id: string;
  title: string;
  description: string;
  audioUrl?: string;
}

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [track, setTrack] = useState<Track | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // While the user drags the slider we stop following status updates, otherwise
  // the ~500ms ticks fight the drag and the thumb snaps back under their finger.
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  // useAudioPlayer re-creates the player when the source changes, so passing
  // null until the download URL resolves is safe.
  const player = useAudioPlayer(sourceUrl);
  const status = useAudioPlayerStatus(player);

  const loadTrack = useCallback(async () => {
    if (!id) {
      setError('No session was selected.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // audioService is untyped JS, so the Firestore payload arrives loosely typed.
      const trackData = (await audioService.getTrackById(id)) as Track;
      setTrack(trackData);

      const url = await audioService.resolveAudioUrl(trackData.audioUrl);
      setSourceUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to load this session.');
      setSourceUrl(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = Number.isFinite(status.duration) ? status.duration : 0;
  const currentTime = isSeeking ? seekPosition : status.currentTime ?? 0;
  const isReady = status.isLoaded && duration > 0;

  const handlePlayPause = () => {
    if (!isReady) return;

    if (status.playing) {
      player.pause();
    } else {
      // Restart from the top instead of sitting at the end doing nothing.
      if (status.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const handleSeekComplete = async (value: number) => {
    try {
      await player.seekTo(value);
    } catch (err) {
      console.error('Error seeking:', err);
    } finally {
      setIsSeeking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading session..." style={styles.centerContent} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <ErrorState error={error} onRetry={loadTrack} style={styles.centerContent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <IconSymbol name="square.and.arrow.up" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Visualization Area */}
      <View style={styles.visualizationContainer}>
        <LinearGradient
          colors={['#3B82F6', '#10B981', '#8B5CF6']}
          style={styles.visualization}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.visualizationOverlay}>
            <View style={styles.wavePattern}>
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveLine,
                    {
                      height: Math.random() * 60 + 20,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle}>{track?.title ?? 'Session'}</Text>
        <Text style={styles.sessionDescription}>{track?.description ?? ''}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={currentTime}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#3B82F6"
          disabled={!isReady}
          onSlidingStart={() => setIsSeeking(true)}
          onValueChange={setSeekPosition}
          onSlidingComplete={handleSeekComplete}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Media Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.playButton, !isReady && styles.playButtonDisabled]}
          onPress={handlePlayPause}
          disabled={!isReady}
        >
          {!isReady || status.isBuffering ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <IconSymbol
              name={status.playing ? 'pause.fill' : 'play.fill'}
              size={32}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)')}>
          <IconSymbol name="book.fill" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/favorites')}>
          <IconSymbol name="heart.fill" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <IconSymbol name="person.fill" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visualizationContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
    height: width - 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  visualization: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wavePattern: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waveLine: {
    width: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
