import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const userService = {
  // Create user profile after signup
  async createUserProfile(userId, userData = {}) {
    try {
      const userDoc = doc(db, 'users', userId);
      
      const defaultUserData = {
        email: userData.email || '',
        displayName: userData.displayName || '',
        profilePicture: userData.profilePicture || '',
        isPremium: false,
        preferences: {
          notifications: true,
          autoplay: false,
          downloadQuality: 'high'
        },
        stats: {
          sessionsCompleted: 0,
          totalListeningTime: 0, // in minutes
          favoriteTracksCount: 0,
          streakDays: 0,
          lastActivity: null
        },
        favorites: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData
      };

      await setDoc(userDoc, defaultUserData);
      return defaultUserData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  },

  // Get user profile data
  async getUserProfile(userId) {
    try {
      const userDoc = doc(db, 'users', userId);
      const snapshot = await getDoc(userDoc);
      
      if (!snapshot.exists()) {
        throw new Error('User profile not found');
      }
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const userDoc = doc(db, 'users', userId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userDoc, updateData);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  },

  // Update user stats when session is completed
  async updateSessionStats(userId, sessionDurationMinutes) {
    try {
      const userDoc = doc(db, 'users', userId);
      
      await updateDoc(userDoc, {
        'stats.sessionsCompleted': increment(1),
        'stats.totalListeningTime': increment(sessionDurationMinutes),
        'stats.lastActivity': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating session stats:', error);
      throw new Error('Failed to update session stats');
    }
  },

  // Update streak when user completes a session
  async updateStreak(userId) {
    try {
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userSnapshot.data();
      const lastActivity = userData.stats?.lastActivity?.toDate();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let newStreak = 1;
      
      if (lastActivity) {
        const lastActivityDate = new Date(
          lastActivity.getFullYear(), 
          lastActivity.getMonth(), 
          lastActivity.getDate()
        );
        
        const daysDiff = (today - lastActivityDate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 1) {
          // Consecutive day
          newStreak = (userData.stats?.streakDays || 0) + 1;
        } else if (daysDiff === 0) {
          // Same day, keep current streak
          newStreak = userData.stats?.streakDays || 1;
        }
        // If daysDiff > 1, streak is broken, so newStreak stays 1
      }
      
      await updateDoc(userDoc, {
        'stats.streakDays': newStreak,
        'stats.lastActivity': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw new Error('Failed to update streak');
    }
  },

  // Update favorite count when user adds/removes favorites
  async updateFavoriteCount(userId, increment = true) {
    try {
      const userDoc = doc(db, 'users', userId);
      
      await updateDoc(userDoc, {
        'stats.favoriteTracksCount': increment ? 
          increment(1) : 
          increment(-1),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating favorite count:', error);
      throw new Error('Failed to update favorite count');
    }
  },

  // Update user preferences
  async updatePreferences(userId, preferences) {
    try {
      const userDoc = doc(db, 'users', userId);
      
      await updateDoc(userDoc, {
        preferences: {
          ...preferences
        },
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  },

  // Check if user profile exists
  async userProfileExists(userId) {
    try {
      const userDoc = doc(db, 'users', userId);
      const snapshot = await getDoc(userDoc);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking user profile existence:', error);
      return false;
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      const userProfile = await this.getUserProfile(userId);
      return userProfile.stats || {
        sessionsCompleted: 0,
        totalListeningTime: 0,
        favoriteTracksCount: 0,
        streakDays: 0,
        lastActivity: null
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user stats');
    }
  },

  // Update premium status
  async updatePremiumStatus(userId, isPremium) {
    try {
      const userDoc = doc(db, 'users', userId);
      
      await updateDoc(userDoc, {
        isPremium,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating premium status:', error);
      throw new Error('Failed to update premium status');
    }
  }
};