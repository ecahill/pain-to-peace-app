import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirebaseError, logFirebaseOperation } from '../config/firebaseConfig';

// =============================================================================
// DATA STRUCTURE DEFINITIONS
// =============================================================================

/**
 * Track Document Structure
 * Collection: tracks/{trackId}
 */
const TrackSchema = {
  id: 'string', // Auto-generated document ID
  title: 'string', // Track title (required)
  description: 'string', // Track description (required)
  duration: 'string', // Duration in format "30 min" (required)
  category: 'string', // SLEEP, PAIN, or ANXIETY (required)
  audioUrl: 'string', // Firebase Storage URL for audio file
  imageUrl: 'string', // Firebase Storage URL for cover image (optional)
  isFree: 'boolean', // Whether track is free or premium (required)
  createdAt: 'timestamp', // Server timestamp (required)
  updatedAt: 'timestamp', // Server timestamp (required)
  createdBy: 'string', // User ID who created the track (optional)
  plays: 'number', // Number of times played (optional, defaults to 0)
  rating: 'number', // Average rating (optional, defaults to 0)
  tags: 'array', // Array of tags for better searching (optional)
};

/**
 * User Document Structure
 * Collection: users/{userId}
 */
const UserSchema = {
  uid: 'string', // Firebase Auth UID (required)
  email: 'string', // User email (required)
  displayName: 'string', // User display name (optional)
  profilePicture: 'string', // Firebase Storage URL for profile image (optional)
  isPremium: 'boolean', // Premium subscription status (required, defaults to false)
  preferences: {
    notifications: 'boolean', // Notification preferences (defaults to true)
    autoplay: 'boolean', // Autoplay next track (defaults to false)
    downloadQuality: 'string', // Audio quality preference (defaults to 'high')
    favoriteCategory: 'string', // User's favorite category (optional)
  },
  stats: {
    sessionsCompleted: 'number', // Total sessions completed (defaults to 0)
    totalListeningTime: 'number', // Total listening time in minutes (defaults to 0)
    favoriteTracksCount: 'number', // Number of favorite tracks (defaults to 0)
    streakDays: 'number', // Current streak in days (defaults to 0)
    lastActivity: 'timestamp', // Last activity timestamp (optional)
    joinedDate: 'timestamp', // When user first used the app (optional)
  },
  favorites: 'array', // Array of track IDs (required, defaults to [])
  createdAt: 'timestamp', // Server timestamp (required)
  updatedAt: 'timestamp', // Server timestamp (required)
};

/**
 * User Progress Document Structure
 * Collection: userProgress/{userId}_{trackId}
 */
const UserProgressSchema = {
  userId: 'string', // User ID (required)
  trackId: 'string', // Track ID (required)
  progress: 'number', // Progress percentage 0-100 (required)
  completed: 'boolean', // Whether session was completed (required)
  lastPlayed: 'timestamp', // Last played timestamp (required)
  totalPlayTime: 'number', // Total time spent on this track in minutes (optional)
  sessions: 'number', // Number of sessions for this track (defaults to 1)
  createdAt: 'timestamp', // Server timestamp (required)
  updatedAt: 'timestamp', // Server timestamp (required)
};

/**
 * User Session Document Structure
 * Collection: userSessions/{userId}/sessions/{sessionId}
 */
const UserSessionSchema = {
  userId: 'string', // User ID (required)
  trackId: 'string', // Track ID (required)
  startTime: 'timestamp', // Session start time (required)
  endTime: 'timestamp', // Session end time (optional)
  duration: 'number', // Session duration in minutes (optional)
  completed: 'boolean', // Whether session was completed (required)
  progress: 'number', // Final progress percentage (optional)
  device: 'string', // Device type (mobile, web, etc.) (optional)
  createdAt: 'timestamp', // Server timestamp (required)
};

// =============================================================================
// SAMPLE DATA
// =============================================================================

const sampleTracks = [
  {
    title: 'Deep Sleep Journey',
    description: 'Drift into restorative sleep naturally with guided relaxation and soothing background sounds.',
    duration: '30 min',
    category: 'SLEEP',
    audioUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/sleep-journey/audio.mp3',
    imageUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/sleep-journey/cover.jpg',
    isFree: true,
    plays: 0,
    rating: 0,
    tags: ['sleep', 'relaxation', 'guided', 'bedtime'],
  },
  {
    title: 'Pain Release Protocol',
    description: 'Advanced hypnotic techniques specifically designed for chronic pain management and relief.',
    duration: '35 min',
    category: 'PAIN',
    audioUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/pain-release/audio.mp3',
    imageUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/pain-release/cover.jpg',
    isFree: false,
    plays: 0,
    rating: 0,
    tags: ['pain', 'chronic', 'healing', 'therapy'],
  },
  {
    title: 'Mindful Relief',
    description: 'Guided meditation combining mindfulness techniques with pain relief visualization.',
    duration: '15 min',
    category: 'PAIN',
    audioUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/mindful-relief/audio.mp3',
    imageUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/mindful-relief/cover.jpg',
    isFree: true,
    plays: 0,
    rating: 0,
    tags: ['mindfulness', 'meditation', 'quick', 'relief'],
  },
  {
    title: 'Evening Calm',
    description: 'Relaxing sounds and gentle guidance to unwind after a difficult day with pain or stress.',
    duration: '20 min',
    category: 'ANXIETY',
    audioUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/evening-calm/audio.mp3',
    imageUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/evening-calm/cover.jpg',
    isFree: false,
    plays: 0,
    rating: 0,
    tags: ['anxiety', 'evening', 'calm', 'stress-relief'],
  },
  {
    title: 'Quick Anxiety Relief',
    description: 'Fast-acting techniques for immediate anxiety and panic relief when you need it most.',
    duration: '10 min',
    category: 'ANXIETY',
    audioUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/anxiety-relief/audio.mp3',
    imageUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/anxiety-relief/cover.jpg',
    isFree: true,
    plays: 0,
    rating: 0,
    tags: ['anxiety', 'quick', 'panic', 'emergency'],
  },
  {
    title: 'Restful Nights',
    description: 'Extended deep sleep hypnosis for those who struggle with staying asleep through the night.',
    duration: '45 min',
    category: 'SLEEP',
    audioUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/restful-nights/audio.mp3',
    imageUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/restful-nights/cover.jpg',
    isFree: false,
    plays: 0,
    rating: 0,
    tags: ['sleep', 'extended', 'insomnia', 'deep-sleep'],
  },
  {
    title: 'Body Scan Healing',
    description: 'Progressive body scan technique for identifying and releasing tension and pain throughout the body.',
    duration: '25 min',
    category: 'PAIN',
    audioUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/body-scan/audio.mp3',
    imageUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/body-scan/cover.jpg',
    isFree: true,
    plays: 0,
    rating: 0,
    tags: ['body-scan', 'progressive', 'tension', 'awareness'],
  },
  {
    title: 'Confidence & Calm',
    description: 'Build inner confidence while reducing social anxiety and performance fears.',
    duration: '18 min',
    category: 'ANXIETY',
    audioUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/confidence-calm/audio.mp3',
    imageUrl: 'gs://pain-to-peace.firebasestorage.app/tracks/confidence-calm/cover.jpg',
    isFree: true,
    plays: 0,
    rating: 0,
    tags: ['confidence', 'social-anxiety', 'performance', 'self-esteem'],
  }
];

// =============================================================================
// SEED DATA FUNCTIONS
// =============================================================================

export const seedDataService = {
  /**
   * Initialize all sample data (tracks and app settings)
   */
  async initializeAllSampleData() {
    try {
      logFirebaseOperation('initializeAllSampleData', 'Starting comprehensive data seeding');
      
      const results = {
        tracks: 0,
        appSettings: 0,
        errors: []
      };

      // Seed tracks
      try {
        results.tracks = await this.initializeSampleTracks();
      } catch (error) {
        results.errors.push({ type: 'tracks', error: error.message });
      }

      // Seed app settings
      try {
        results.appSettings = await this.initializeAppSettings();
      } catch (error) {
        results.errors.push({ type: 'appSettings', error: error.message });
      }

      logFirebaseOperation('initializeAllSampleData', `Completed: ${results.tracks} tracks, ${results.appSettings} settings, ${results.errors.length} errors`);
      return results;
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Initializing sample data');
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Create sample tracks in Firestore (enhanced version of existing function)
   */
  async initializeSampleTracks() {
    try {
      logFirebaseOperation('initializeSampleTracks', 'Checking existing tracks');
      
      const tracksCollection = collection(db, 'tracks');
      const snapshot = await getDocs(tracksCollection);
      
      if (snapshot.size > 0) {
        logFirebaseOperation('initializeSampleTracks', `Found ${snapshot.size} existing tracks, skipping initialization`);
        return 0;
      }

      logFirebaseOperation('initializeSampleTracks', `Adding ${sampleTracks.length} sample tracks`);
      
      // Use batch for better performance and atomicity
      const batch = writeBatch(db);
      let addedCount = 0;

      sampleTracks.forEach((track) => {
        const docRef = doc(tracksCollection);
        const trackData = {
          ...track,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'system', // System-created tracks
        };
        batch.set(docRef, trackData);
        addedCount++;
      });

      await batch.commit();
      logFirebaseOperation('initializeSampleTracks', `Successfully added ${addedCount} tracks using batch operation`);
      
      return addedCount;
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Initializing sample tracks');
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Initialize app settings and configuration
   */
  async initializeAppSettings() {
    try {
      logFirebaseOperation('initializeAppSettings', 'Setting up app configuration');

      const settings = [
        {
          id: 'app-config',
          data: {
            appName: 'Pain to Peace',
            version: '1.0.0',
            minSupportedVersion: '1.0.0',
            maintenanceMode: false,
            features: {
              offline: true,
              socialSharing: false,
              userUploads: true,
              premiumTracks: true,
            },
            updatedAt: serverTimestamp(),
          }
        },
        {
          id: 'content-categories',
          data: {
            categories: [
              { id: 'SLEEP', name: 'Sleep', color: '#8B5CF6', icon: 'moon' },
              { id: 'PAIN', name: 'Pain Relief', color: '#3B82F6', icon: 'heart' },
              { id: 'ANXIETY', name: 'Anxiety', color: '#10B981', icon: 'shield' },
            ],
            updatedAt: serverTimestamp(),
          }
        },
        {
          id: 'subscription-tiers',
          data: {
            free: {
              name: 'Free',
              price: 0,
              features: ['Access to free tracks', 'Basic progress tracking'],
              limits: { tracksPerMonth: null }
            },
            premium: {
              name: 'Premium',
              price: 9.99,
              features: ['All tracks', 'Advanced analytics', 'Offline downloads', 'No ads'],
              limits: { tracksPerMonth: null }
            },
            updatedAt: serverTimestamp(),
          }
        }
      ];

      const settingsCollection = collection(db, 'appSettings');
      let addedCount = 0;

      for (const setting of settings) {
        const docRef = doc(settingsCollection, setting.id);
        await setDoc(docRef, setting.data);
        addedCount++;
      }

      logFirebaseOperation('initializeAppSettings', `Successfully added ${addedCount} app settings`);
      return addedCount;
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Initializing app settings');
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Create a sample user profile (for testing)
   */
  async createSampleUserProfile(userId, userData = {}) {
    try {
      logFirebaseOperation('createSampleUserProfile', `Creating profile for user ${userId}`);

      const defaultUserData = {
        uid: userId,
        email: userData.email || 'sample@example.com',
        displayName: userData.displayName || 'Sample User',
        profilePicture: '',
        isPremium: false,
        preferences: {
          notifications: true,
          autoplay: false,
          downloadQuality: 'high',
        },
        stats: {
          sessionsCompleted: 0,
          totalListeningTime: 0,
          favoriteTracksCount: 0,
          streakDays: 0,
          lastActivity: null,
          joinedDate: serverTimestamp(),
        },
        favorites: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData
      };

      const userDoc = doc(db, 'users', userId);
      await setDoc(userDoc, defaultUserData);

      logFirebaseOperation('createSampleUserProfile', `Successfully created profile for user ${userId}`);
      return defaultUserData;
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Creating sample user profile');
      throw new Error(friendlyMessage);
    }
  },

  /**
   * Get data structure documentation
   */
  getDataStructures() {
    return {
      TrackSchema,
      UserSchema,
      UserProgressSchema,
      UserSessionSchema,
      sampleTracks: sampleTracks.map(track => ({
        ...track,
        // Remove actual URLs for documentation
        audioUrl: '[Firebase Storage URL]',
        imageUrl: '[Firebase Storage URL]'
      }))
    };
  },

  /**
   * Validate data structure (for testing)
   */
  validateTrackData(trackData) {
    const required = ['title', 'description', 'duration', 'category', 'isFree'];
    const missing = required.filter(field => !trackData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    const validCategories = ['SLEEP', 'PAIN', 'ANXIETY'];
    if (!validCategories.includes(trackData.category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    if (typeof trackData.isFree !== 'boolean') {
      throw new Error('isFree must be a boolean');
    }

    return true;
  }
};