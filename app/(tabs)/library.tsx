import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';

interface Track {
  id: string;
  title: string;
  duration: string;
  description: string;
}

const tracks: Track[] = [
  {
    id: '1',
    title: 'Mindful Relief',
    duration: '15 min',
    description: 'Guided meditation to ease chronic pain and tension',
  },
  {
    id: '2',
    title: 'Evening Calm',
    duration: '20 min',
    description: 'Relaxing sounds to unwind after a difficult day',
  },
  {
    id: '3',
    title: 'Peaceful Sleep',
    duration: '25 min',
    description: 'Gentle hypnosis to help you drift into restful sleep',
  },
  {
    id: '4',
    title: 'Body Scan Relief',
    duration: '18 min',
    description: 'Progressive relaxation technique for pain management',
  },
];

export default function LibraryScreen() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const handleTrackPress = (track: Track) => {
    router.push('/player');
  };

  const toggleFavorite = (trackId: string) => {
    setFavorites(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Library</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <IconSymbol name="gear" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracks..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Tracks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracks</Text>
          {tracks.map((track) => (
            <TouchableOpacity
              key={track.id}
              style={styles.trackCard}
              onPress={() => handleTrackPress(track)}
            >
              <View style={styles.trackContent}>
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackMeta}>{track.duration}</Text>
                  <Text style={styles.trackDescription}>{track.description}</Text>
                </View>
                <View style={styles.trackActions}>
                  <TouchableOpacity 
                    style={styles.heartButton}
                    onPress={() => toggleFavorite(track.id)}
                  >
                    <IconSymbol 
                      name={favorites.includes(track.id) ? "heart.fill" : "heart"} 
                      size={20} 
                      color={favorites.includes(track.id) ? "#EF4444" : "#9CA3AF"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.playButton}>
                    <IconSymbol name="play.fill" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  settingsButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  trackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  trackMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  trackDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
});
