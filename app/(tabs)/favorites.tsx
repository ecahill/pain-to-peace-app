import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { audioService } from '../../services/audioService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoriteTrack {
  id: string;
  title: string;
  duration: string;
  description: string;
  category: 'SLEEP' | 'PAIN' | 'ANXIETY';
  isFree: boolean;
}

const getCategoryColor = (category: FavoriteTrack['category']) => {
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

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const checkUserAndLoadFavorites = async () => {
      try {
        // Check guest status
        const guestStatus = await AsyncStorage.getItem('isGuest');
        setIsGuest(guestStatus === 'true');
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserAndLoadFavorites();

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && !isGuest) {
        await loadUserFavorites(user.uid);
      } else {
        setFavorites([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isGuest]);

  const loadUserFavorites = async (userId: string) => {
    try {
      setLoading(true);
      const userFavorites = await audioService.getUserFavorites(userId);
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error loading user favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    if (isGuest || !user) {
      Alert.alert('Login Required', 'Please log in to manage favorites');
      return;
    }

    try {
      await audioService.removeFromFavorites(user.uid, id);
      setFavorites(favorites.filter(track => track.id !== id));
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove from favorites');
    }
  };

  const handleTrackPress = (track: FavoriteTrack) => {
    router.push('/player');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Favorites</Text>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol name="person.crop.circle" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Login Required</Text>
            <Text style={styles.emptySubtitle}>
              Please log in to save and view your favorite tracks
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.browseButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Favorites</Text>
        </View>

        {/* Favorites List */}
        {favorites.length > 0 ? (
          <View style={styles.favoritesContainer}>
            {favorites.map((track) => (
              <TouchableOpacity
                key={track.id}
                style={styles.favoriteCard}
                onPress={() => handleTrackPress(track)}
              >
                <View style={styles.favoriteContent}>
                  <View style={[styles.favoriteIcon, { backgroundColor: getCategoryColor(track.category) }]}>
                    <IconSymbol name="play.fill" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.favoriteInfo}>
                    <Text style={styles.favoriteTitle}>{track.title}</Text>
                    <Text style={styles.favoriteMeta}>{track.duration}</Text>
                    <Text style={styles.favoriteDescription}>{track.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(track.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol name="heart" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Save tracks you love by tapping the heart icon while listening
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.browseButtonText}>Explore tracks</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  favoritesContainer: {
    paddingBottom: 32,
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  favoriteMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  favoriteDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  browseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});