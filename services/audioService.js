import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDoc,
  setDoc,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../app/firebase/firebaseConfig';

export const audioService = {
  // Fetch all tracks from Firestore
  async getTracks() {
    try {
      const tracksCollection = collection(db, 'tracks');
      const tracksQuery = query(tracksCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(tracksQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw new Error('Failed to fetch tracks');
    }
  },

  // Fetch tracks by category
  async getTracksByCategory(category) {
    try {
      const tracksCollection = collection(db, 'tracks');
      const tracksQuery = query(
        tracksCollection, 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tracksQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching tracks by category:', error);
      throw new Error('Failed to fetch tracks by category');
    }
  },

  // Get user's favorite tracks
  async getUserFavorites(userId) {
    try {
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        return [];
      }
      
      const userData = userSnapshot.data();
      const favoriteIds = userData.favorites || [];
      
      if (favoriteIds.length === 0) {
        return [];
      }

      // Fetch the actual track documents
      const tracksCollection = collection(db, 'tracks');
      const tracksQuery = query(tracksCollection, where('__name__', 'in', favoriteIds));
      const snapshot = await getDocs(tracksQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      throw new Error('Failed to fetch favorites');
    }
  },

  // Add track to user's favorites
  async addToFavorites(userId, trackId) {
    try {
      const userDoc = doc(db, 'users', userId);
      
      // Check if user document exists, create if not
      const userSnapshot = await getDoc(userDoc);
      if (!userSnapshot.exists()) {
        await setDoc(userDoc, {
          favorites: [trackId],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        await updateDoc(userDoc, {
          favorites: arrayUnion(trackId),
          updatedAt: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites');
    }
  },

  // Remove track from user's favorites
  async removeFromFavorites(userId, trackId) {
    try {
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, {
        favorites: arrayRemove(trackId),
        updatedAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites');
    }
  },

  // Track listening progress
  async updateListeningProgress(userId, trackId, progress, completed = false) {
    try {
      const progressDoc = doc(db, 'userProgress', `${userId}_${trackId}`);
      
      await setDoc(progressDoc, {
        userId,
        trackId,
        progress: Math.min(100, Math.max(0, progress)), // Ensure progress is between 0-100
        completed,
        lastPlayed: new Date(),
        updatedAt: new Date()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error updating listening progress:', error);
      throw new Error('Failed to update progress');
    }
  },

  // Get user's listening progress for a specific track
  async getTrackProgress(userId, trackId) {
    try {
      const progressDoc = doc(db, 'userProgress', `${userId}_${trackId}`);
      const snapshot = await getDoc(progressDoc);
      
      if (!snapshot.exists()) {
        return { progress: 0, completed: false };
      }
      
      return snapshot.data();
    } catch (error) {
      console.error('Error fetching track progress:', error);
      return { progress: 0, completed: false };
    }
  },

  // Get all user's listening progress
  async getUserProgress(userId) {
    try {
      const progressCollection = collection(db, 'userProgress');
      const progressQuery = query(
        progressCollection, 
        where('userId', '==', userId),
        orderBy('lastPlayed', 'desc')
      );
      const snapshot = await getDocs(progressQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw new Error('Failed to fetch user progress');
    }
  },

  // Search tracks by title or description
  async searchTracks(searchTerm) {
    try {
      const tracksCollection = collection(db, 'tracks');
      const snapshot = await getDocs(tracksCollection);
      
      const searchLower = searchTerm.toLowerCase();
      const results = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(track => 
          track.title.toLowerCase().includes(searchLower) ||
          track.description.toLowerCase().includes(searchLower)
        );
      
      return results;
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw new Error('Failed to search tracks');
    }
  }
};