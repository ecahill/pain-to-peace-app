import React from 'react';
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

interface CategoryCard {
  title: string;
  emoji: string;
  description: string;
}

interface Session {
  id: string;
  title: string;
  duration: string;
  category: string;
  author: string;
}

const categories: CategoryCard[] = [
  {
    title: 'Deep Relaxation',
    emoji: '🌙',
    description: 'Find peace and tranquility',
  },
  {
    title: 'Pain Relief',
    emoji: '💚',
    description: 'Manage discomfort effectively',
  },
  {
    title: 'Sleep',
    emoji: '😴',
    description: 'Drift into a restful night',
  },
];

const sessions: Session[] = [
  {
    id: '1',
    title: 'Mindful Relief',
    duration: '15 min',
    category: 'Pain Relief',
    author: 'Dr. Anya Sharma',
  },
  {
    id: '2',
    title: 'Evening Calm',
    duration: '20 min',
    category: 'Deep Relaxation',
    author: 'Dr. Sarah Chen',
  },
  {
    id: '3',
    title: 'Peaceful Sleep',
    duration: '25 min',
    category: 'Sleep',
    author: 'Dr. Michael Torres',
  },
  {
    id: '4',
    title: 'Body Scan Relief',
    duration: '18 min',
    category: 'Pain Relief',
    author: 'Dr. Anya Sharma',
  },
];

export default function LibraryScreen() {
  const handleSessionPress = (session: Session) => {
    router.push('/player');
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
            placeholder="Search sessions..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {categories.map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryCard}>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sessions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          {sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => handleSessionPress(session)}
            >
              <View style={styles.sessionContent}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionMeta}>
                    {session.duration} • {session.category}
                  </Text>
                  <Text style={styles.sessionAuthor}>by {session.author}</Text>
                </View>
                <TouchableOpacity style={styles.playButton}>
                  <IconSymbol name="play.fill" size={20} color="#FFFFFF" />
                </TouchableOpacity>
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
  categoryCard: {
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
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionCard: {
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
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sessionMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  sessionAuthor: {
    fontSize: 12,
    color: '#9CA3AF',
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
