import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';

interface FavoriteSession {
  id: string;
  title: string;
  duration: string;
  category: string;
  author: string;
  color: string;
}

const initialFavorites: FavoriteSession[] = [
  {
    id: '1',
    title: 'Mindful Relief',
    duration: '15 min',
    category: 'Pain Relief',
    author: 'Dr. Anya Sharma',
    color: '#10B981',
  },
  {
    id: '2',
    title: 'Evening Calm',
    duration: '20 min',
    category: 'Deep Relaxation',
    author: 'Dr. Sarah Chen',
    color: '#3B82F6',
  },
  {
    id: '3',
    title: 'Peaceful Sleep',
    duration: '25 min',
    category: 'Sleep',
    author: 'Dr. Michael Torres',
    color: '#8B5CF6',
  },
];

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteSession[]>(initialFavorites);

  const handleRemoveFavorite = (id: string) => {
    setFavorites(favorites.filter(session => session.id !== id));
  };

  const handleSessionPress = (session: FavoriteSession) => {
    router.push('/player');
  };

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
            {favorites.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.favoriteCard}
                onPress={() => handleSessionPress(session)}
              >
                <View style={styles.favoriteContent}>
                  <View style={[styles.favoriteIcon, { backgroundColor: session.color }]}>
                    <IconSymbol name="play.fill" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.favoriteInfo}>
                    <Text style={styles.favoriteTitle}>{session.title}</Text>
                    <Text style={styles.favoriteMeta}>
                      {session.duration} • {session.category}
                    </Text>
                    <Text style={styles.favoriteAuthor}>by {session.author}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(session.id)}
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
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>
              Sessions you favorite will appear here for quick access
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/library')}
            >
              <Text style={styles.browseButtonText}>Browse Library</Text>
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
  favoriteAuthor: {
    fontSize: 12,
    color: '#9CA3AF',
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
});