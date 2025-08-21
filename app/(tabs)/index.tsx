import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Track {
  id: string;
  title: string;
  duration: string;
  description: string;
  category: 'SLEEP' | 'PAIN' | 'ANXIETY';
  isFree: boolean;
}

interface Category {
  id: string;
  name: string;
  filter: string;
}

const categories: Category[] = [
  { id: 'all', name: 'All', filter: '' },
  { id: 'pain', name: 'Pain', filter: 'PAIN' },
  { id: 'sleep', name: 'Sleep', filter: 'SLEEP' },
  { id: 'anxiety', name: 'Anxiety', filter: 'ANXIETY' },
];

const tracks: Track[] = [
  {
    id: '1',
    title: 'Deep Sleep Journey',
    duration: '30 min',
    description: 'Drift into restorative sleep naturally',
    category: 'SLEEP',
    isFree: true,
  },
  {
    id: '2',
    title: 'Pain Release Protocol',
    duration: '35 min',
    description: 'Advanced techniques for chronic pain management',
    category: 'PAIN',
    isFree: false,
  },
  {
    id: '3',
    title: 'Mindful Relief',
    duration: '15 min',
    description: 'Guided meditation to ease chronic pain and tension',
    category: 'PAIN',
    isFree: true,
  },
  {
    id: '4',
    title: 'Evening Calm',
    duration: '20 min',
    description: 'Relaxing sounds to unwind after a difficult day',
    category: 'ANXIETY',
    isFree: false,
  },
];

const getCategoryColor = (category: Track['category']) => {
  switch (category) {
    case 'SLEEP':
      return '#8B5CF6'; // Purple
    case 'PAIN':
      return '#3B82F6'; // Blue
    case 'ANXIETY':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
};

export default function LibraryScreen() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  // Check if user is a guest on component mount
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const guestStatus = await AsyncStorage.getItem('isGuest');
        setIsGuest(guestStatus === 'true');
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    checkUserStatus();
  }, []);

  const handleTrackPress = (track: Track) => {
    // Only allow access to free tracks for guests
    if (isGuest && !track.isFree) {
      // TODO: Show upgrade prompt/modal
      console.log('Premium track - show upgrade prompt');
      return;
    }
    router.push('/player');
  };

  const toggleFavorite = (trackId: string) => {
    setFavorites(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const filteredTracks = tracks.filter(track => {
    const matchesCategory = selectedCategory === 'all' || track.category === categories.find(c => c.id === selectedCategory)?.filter;
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         track.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch; // Show all tracks, but style premium ones differently for guests
  });

  return (
    <LinearGradient
      colors={['#E0F2FE', '#F0F9FF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Library</Text>
              <Text style={styles.headerSubtitle}>
                {isGuest ? 'Free tracks available as a guest' : 'Browse our collection'}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tracks..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filter Chips */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScrollView}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipSelected
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tracks List */}
          <View style={styles.tracksContainer}>
            {filteredTracks.map((track) => {
              const isLocked = isGuest && !track.isFree;
              return (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.trackCard,
                  isLocked && styles.trackCardLocked
                ]}
                onPress={() => handleTrackPress(track)}
                activeOpacity={isLocked ? 0.3 : 0.7}
                disabled={isLocked}
              >
                <View style={styles.trackHeader}>
                  <View style={styles.trackTitleRow}>
                    <View style={styles.titleWithLock}>
                      <Text style={[
                        styles.trackTitle,
                        isLocked && styles.trackTitleLocked
                      ]}>
                        {track.title}
                      </Text>
                      {isLocked && (
                        <IconSymbol name="lock.fill" size={16} color="#9CA3AF" />
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.heartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (!isLocked) {
                          toggleFavorite(track.id);
                        }
                      }}
                      disabled={isLocked}
                    >
                      <IconSymbol 
                        name={favorites.includes(track.id) ? "heart.fill" : "heart"} 
                        size={20} 
                        color={isLocked ? "#D1D5DB" : (favorites.includes(track.id) ? "#EF4444" : "#9CA3AF")} 
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[
                    styles.trackDescription,
                    isLocked && styles.trackDescriptionLocked
                  ]}>
                    {track.description}
                  </Text>
                  <View style={styles.trackFooter}>
                    <Text style={[
                      styles.trackDuration,
                      isLocked && styles.trackDurationLocked
                    ]}>
                      {track.duration}
                    </Text>
                    <View style={styles.tagsContainer}>
                      {!track.isFree && (
                        <View style={styles.premiumTag}>
                          <Text style={styles.premiumTagText}>PREMIUM</Text>
                        </View>
                      )}
                      <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(track.category) }]}>
                        <Text style={styles.categoryTagText}>{track.category}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryScrollView: {
    marginBottom: 24,
  },
  categoryContainer: {
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipSelected: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  tracksContainer: {
    paddingBottom: 100,
  },
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  trackCardLocked: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  trackHeader: {
    flex: 1,
  },
  trackTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleWithLock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 8,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  trackTitleLocked: {
    color: '#9CA3AF',
  },
  heartButton: {
    padding: 4,
  },
  trackDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  trackDescriptionLocked: {
    color: '#9CA3AF',
  },
  trackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackDuration: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  trackDurationLocked: {
    color: '#9CA3AF',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  premiumTag: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premiumTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  categoryTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});