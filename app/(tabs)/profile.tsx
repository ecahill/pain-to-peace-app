import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface MenuItem {
  title: string;
  icon: string;
  action: () => void;
}

const stats: StatCard[] = [
  {
    title: 'Sessions Completed',
    value: '24',
    icon: 'checkmark.circle.fill',
    color: '#10B981',
  },
  {
    title: 'Total Time',
    value: '6h 20m',
    icon: 'clock.fill',
    color: '#3B82F6',
  },
  {
    title: 'Day Streak',
    value: '7',
    icon: 'flame.fill',
    color: '#F59E0B',
  },
];

export default function ProfileScreen() {
  const menuItems: MenuItem[] = [
    {
      title: 'Settings',
      icon: 'gear',
      action: () => console.log('Settings pressed'),
    },
    {
      title: 'Help & Support',
      icon: 'questionmark.circle',
      action: () => console.log('Help pressed'),
    },
    {
      title: 'About',
      icon: 'info.circle',
      action: () => console.log('About pressed'),
    },
    {
      title: 'Sign Out',
      icon: 'rectangle.portrait.and.arrow.right',
      action: () => console.log('Sign out pressed'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>EM</Text>
            </View>
          </View>
          <Text style={styles.userName}>Emily</Text>
          <Text style={styles.userSubtitle}>Pain Relief Journey</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                  <IconSymbol name={stat.icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item.title === 'Sign Out' && styles.signOutItem,
              ]}
              onPress={item.action}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol 
                    name={item.icon} 
                    size={20} 
                    color={item.title === 'Sign Out' ? '#EF4444' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.menuItemText,
                    item.title === 'Sign Out' && styles.signOutText,
                  ]}>
                    {item.title}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#D1D5DB" />
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
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  menuSection: {
    marginBottom: 32,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutItem: {
    marginTop: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
  },
  signOutText: {
    color: '#EF4444',
  },
});