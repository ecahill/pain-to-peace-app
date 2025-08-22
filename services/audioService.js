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
  orderBy,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirebaseError, logFirebaseOperation } from '../app/firebase/firebaseConfig';

export const audioService = {
  // Fetch all tracks from Firestore
  async getTracks() {
    try {
      logFirebaseOperation('getTracks', 'Fetching all tracks');
      const tracksCollection = collection(db, 'tracks');
      const tracksQuery = query(tracksCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(tracksQuery);
      
      const tracks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      logFirebaseOperation('getTracks', `Successfully fetched ${tracks.length} tracks`);
      return tracks;
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Fetching tracks');
      throw new Error(friendlyMessage);
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
      logFirebaseOperation('addToFavorites', `Adding track ${trackId} to user ${userId} favorites`);
      const userDoc = doc(db, 'users', userId);
      
      // Check if user document exists, create if not
      const userSnapshot = await getDoc(userDoc);
      if (!userSnapshot.exists()) {
        await setDoc(userDoc, {
          favorites: [trackId],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        logFirebaseOperation('addToFavorites', 'Created new user document with favorite');
      } else {
        await updateDoc(userDoc, {
          favorites: arrayUnion(trackId),
          updatedAt: new Date()
        });
        logFirebaseOperation('addToFavorites', 'Updated existing user favorites');
      }
      
      return true;
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Adding to favorites');
      throw new Error(friendlyMessage);
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
  },

  // Initialize sample tracks (for testing)
  async initializeSampleTracks() {
    try {
      console.log('🎵 Checking if sample tracks need to be added...');
      
      // Check if tracks collection already has data
      const tracksCollection = collection(db, 'tracks');
      const snapshot = await getDocs(tracksCollection);
      
      if (snapshot.size > 0) {
        console.log(`📊 Tracks collection already has ${snapshot.size} tracks. Skipping initialization.`);
        return false;
      }

      console.log('🚀 Adding sample tracks to Firestore...');
      
      const sampleTracks = [
        {
          title: 'Deep Sleep Journey',
          duration: '30 min',
          description: 'Drift into restorative sleep naturally with guided relaxation',
          category: 'SLEEP',
          isFree: true,
          audioUrl: '', // Would be populated with actual audio file URLs
          imageUrl: '', // Would be populated with track cover images
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: 'Pain Release Protocol',
          duration: '35 min',
          description: 'Advanced techniques for chronic pain management and relief',
          category: 'PAIN',
          isFree: false,
          audioUrl: '',
          imageUrl: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: 'Mindful Relief',
          duration: '15 min',
          description: 'Guided meditation to ease chronic pain and tension',
          category: 'PAIN',
          isFree: true,
          audioUrl: '',
          imageUrl: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: 'Evening Calm',
          duration: '20 min',
          description: 'Relaxing sounds to unwind after a difficult day',
          category: 'ANXIETY',
          isFree: false,
          audioUrl: '',
          imageUrl: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: 'Quick Anxiety Relief',
          duration: '10 min',
          description: 'Fast-acting techniques for immediate anxiety relief',
          category: 'ANXIETY',
          isFree: true,
          audioUrl: '',
          imageUrl: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          title: 'Restful Nights',
          duration: '45 min',
          description: 'Extended sleep hypnosis for deep, restful sleep',
          category: 'SLEEP',
          isFree: false,
          audioUrl: '',
          imageUrl: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      const promises = sampleTracks.map(track => addDoc(tracksCollection, track));
      await Promise.all(promises);
      
      console.log(`✅ Successfully added ${sampleTracks.length} sample tracks to Firestore!`);
      return true;
    } catch (error) {
      console.error('❌ Error initializing sample tracks:', error);
      throw new Error('Failed to initialize sample tracks');
    }
  }
};