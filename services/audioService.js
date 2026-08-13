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
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage, handleFirebaseError, logFirebaseOperation } from '../config/firebaseConfig';

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

  // Fetch a single track by its document ID
  async getTrackById(trackId) {
    try {
      logFirebaseOperation('getTrackById', `Fetching track ${trackId}`);
      const trackDoc = doc(db, 'tracks', trackId);
      const snapshot = await getDoc(trackDoc);

      if (!snapshot.exists()) {
        throw new Error('This session is no longer available.');
      }

      return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Fetching track');
      throw new Error(friendlyMessage);
    }
  },

  // Resolve a stored audioUrl into a URL an audio player can actually stream.
  // Tracks are seeded with gs:// URIs, which no player accepts, so those are
  // exchanged for tokenized HTTPS download URLs. Values that are already HTTPS
  // are passed straight through, so this is safe to call on any track.
  async resolveAudioUrl(audioUrl) {
    if (!audioUrl) {
      throw new Error('This session has no audio file attached yet.');
    }

    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      return audioUrl;
    }

    try {
      logFirebaseOperation('resolveAudioUrl', `Resolving ${audioUrl}`);
      // ref() accepts both gs:// URIs and bucket-relative paths.
      const downloadUrl = await getDownloadURL(ref(storage, audioUrl));
      logFirebaseOperation('resolveAudioUrl', 'Resolved to download URL');
      return downloadUrl;
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Loading audio file');
      throw new Error(friendlyMessage);
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

  // Initialize sample tracks (enhanced version)
  async initializeSampleTracks() {
    try {
      logFirebaseOperation('initializeSampleTracks', 'Using enhanced seed data service');
      
      // Use the new seedDataService for better data structure
      const { seedDataService } = await import('./seedData');
      const addedCount = await seedDataService.initializeSampleTracks();
      
      return addedCount > 0;
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Initializing sample tracks');
      throw new Error(friendlyMessage);
    }
  }
};