import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { logFirebaseOperation } from '../config/firebaseConfig';

// =============================================================================
// OFFLINE SERVICE - Handles offline data caching and sync
// =============================================================================

const CACHE_KEYS = {
  TRACKS: 'cached_tracks',
  USER_FAVORITES: 'cached_user_favorites_',
  USER_PROGRESS: 'cached_user_progress_',
  APP_SETTINGS: 'cached_app_settings',
  LAST_SYNC: 'last_sync_timestamp',
  PENDING_OPERATIONS: 'pending_operations',
};

const CACHE_EXPIRY = {
  TRACKS: 24 * 60 * 60 * 1000, // 24 hours
  USER_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  APP_SETTINGS: 24 * 60 * 60 * 1000, // 24 hours
};

export const offlineService = {
  // =============================================================================
  // NETWORK STATUS
  // =============================================================================
  
  async getNetworkState() {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      };
    } catch (error) {
      console.warn('Could not get network state:', error);
      return { isConnected: false, type: null, isInternetReachable: false };
    }
  },

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  // Cache tracks data
  async cacheTracks(tracks) {
    try {
      const cacheData = {
        data: tracks,
        timestamp: Date.now(),
        version: '1.0',
      };
      await AsyncStorage.setItem(CACHE_KEYS.TRACKS, JSON.stringify(cacheData));
      logFirebaseOperation('offlineService', `Cached ${tracks.length} tracks`);
    } catch (error) {
      console.error('Error caching tracks:', error);
    }
  },

  // Get cached tracks
  async getCachedTracks() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.TRACKS);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > CACHE_EXPIRY.TRACKS) {
        logFirebaseOperation('offlineService', 'Tracks cache expired, removing');
        await AsyncStorage.removeItem(CACHE_KEYS.TRACKS);
        return null;
      }

      logFirebaseOperation('offlineService', `Retrieved ${cacheData.data.length} cached tracks`);
      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached tracks:', error);
      return null;
    }
  },

  // Cache user favorites
  async cacheUserFavorites(userId, favorites) {
    try {
      const cacheData = {
        data: favorites,
        timestamp: Date.now(),
        userId,
      };
      await AsyncStorage.setItem(
        CACHE_KEYS.USER_FAVORITES + userId, 
        JSON.stringify(cacheData)
      );
      logFirebaseOperation('offlineService', `Cached ${favorites.length} favorites for user ${userId}`);
    } catch (error) {
      console.error('Error caching user favorites:', error);
    }
  },

  // Get cached user favorites
  async getCachedUserFavorites(userId) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.USER_FAVORITES + userId);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > CACHE_EXPIRY.USER_DATA) {
        await AsyncStorage.removeItem(CACHE_KEYS.USER_FAVORITES + userId);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached user favorites:', error);
      return null;
    }
  },

  // Cache user progress
  async cacheUserProgress(userId, progress) {
    try {
      const cacheData = {
        data: progress,
        timestamp: Date.now(),
        userId,
      };
      await AsyncStorage.setItem(
        CACHE_KEYS.USER_PROGRESS + userId, 
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Error caching user progress:', error);
    }
  },

  // Get cached user progress
  async getCachedUserProgress(userId) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.USER_PROGRESS + userId);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > CACHE_EXPIRY.USER_DATA) {
        await AsyncStorage.removeItem(CACHE_KEYS.USER_PROGRESS + userId);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached user progress:', error);
      return null;
    }
  },

  // =============================================================================
  // OFFLINE OPERATIONS QUEUE
  // =============================================================================

  // Add operation to pending queue (for when back online)
  async queueOperation(operation) {
    try {
      const pending = await this.getPendingOperations();
      const newOperation = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...operation,
      };
      
      pending.push(newOperation);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_OPERATIONS, JSON.stringify(pending));
      
      logFirebaseOperation('offlineService', `Queued operation: ${operation.type}`);
      return newOperation.id;
    } catch (error) {
      console.error('Error queueing operation:', error);
      return null;
    }
  },

  // Get all pending operations
  async getPendingOperations() {
    try {
      const pending = await AsyncStorage.getItem(CACHE_KEYS.PENDING_OPERATIONS);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  },

  // Remove operation from queue
  async removeOperation(operationId) {
    try {
      const pending = await this.getPendingOperations();
      const filtered = pending.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_OPERATIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing operation:', error);
    }
  },

  // Process pending operations when back online
  async processPendingOperations() {
    try {
      const networkState = await this.getNetworkState();
      if (!networkState.isConnected) {
        return { processed: 0, failed: 0 };
      }

      const pending = await this.getPendingOperations();
      if (pending.length === 0) {
        return { processed: 0, failed: 0 };
      }

      logFirebaseOperation('offlineService', `Processing ${pending.length} pending operations`);

      let processed = 0;
      let failed = 0;

      for (const operation of pending) {
        try {
          await this.executeOperation(operation);
          await this.removeOperation(operation.id);
          processed++;
        } catch (error) {
          console.error(`Failed to execute operation ${operation.id}:`, error);
          failed++;
          
          // Remove old failed operations (older than 7 days)
          const age = Date.now() - operation.timestamp;
          if (age > 7 * 24 * 60 * 60 * 1000) {
            await this.removeOperation(operation.id);
          }
        }
      }

      logFirebaseOperation('offlineService', `Processed: ${processed}, Failed: ${failed}`);
      return { processed, failed };
    } catch (error) {
      console.error('Error processing pending operations:', error);
      return { processed: 0, failed: 0 };
    }
  },

  // Execute a specific operation
  async executeOperation(operation) {
    const { audioService } = await import('./audioService');
    const { userService } = await import('./userService');

    switch (operation.type) {
      case 'ADD_FAVORITE':
        await audioService.addToFavorites(operation.userId, operation.trackId);
        break;
        
      case 'REMOVE_FAVORITE':
        await audioService.removeFromFavorites(operation.userId, operation.trackId);
        break;
        
      case 'UPDATE_PROGRESS':
        await audioService.updateListeningProgress(
          operation.userId, 
          operation.trackId, 
          operation.progress, 
          operation.completed
        );
        break;
        
      case 'UPDATE_USER_STATS':
        await userService.updateSessionStats(operation.userId, operation.duration);
        break;
        
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  },

  // =============================================================================
  // SYNC MANAGEMENT
  // =============================================================================

  // Update last sync timestamp
  async updateLastSync() {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('Error updating last sync:', error);
    }
  },

  // Get last sync timestamp
  async getLastSync() {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error('Error getting last sync:', error);
      return null;
    }
  },

  // Check if data needs refresh
  async needsRefresh(cacheType = 'tracks') {
    try {
      const lastSync = await this.getLastSync();
      if (!lastSync) return true;

      const age = Date.now() - lastSync;
      const threshold = CACHE_EXPIRY[cacheType.toUpperCase()] || CACHE_EXPIRY.TRACKS;
      
      return age > threshold;
    } catch (error) {
      console.error('Error checking refresh need:', error);
      return true;
    }
  },

  // =============================================================================
  // CLEANUP AND MAINTENANCE
  // =============================================================================

  // Clear all cached data
  async clearCache() {
    try {
      const keys = Object.values(CACHE_KEYS);
      await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
      logFirebaseOperation('offlineService', 'Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Clear expired cache entries
  async clearExpiredCache() {
    try {
      const now = Date.now();
      const tracks = await AsyncStorage.getItem(CACHE_KEYS.TRACKS);
      
      if (tracks) {
        const tracksData = JSON.parse(tracks);
        if (now - tracksData.timestamp > CACHE_EXPIRY.TRACKS) {
          await AsyncStorage.removeItem(CACHE_KEYS.TRACKS);
        }
      }

      // Clear expired user data (this is a simplified version)
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => 
        key.startsWith(CACHE_KEYS.USER_FAVORITES) || 
        key.startsWith(CACHE_KEYS.USER_PROGRESS)
      );

      for (const key of userKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (now - parsed.timestamp > CACHE_EXPIRY.USER_DATA) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted entries
          await AsyncStorage.removeItem(key);
        }
      }

      logFirebaseOperation('offlineService', 'Expired cache entries cleared');
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  },

  // Get cache statistics
  async getCacheStats() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => 
        Object.values(CACHE_KEYS).some(cacheKey => key.includes(cacheKey))
      );

      const stats = {
        totalCacheEntries: cacheKeys.length,
        tracks: null,
        userFavorites: 0,
        userProgress: 0,
        pendingOperations: 0,
      };

      // Check tracks cache
      const tracks = await AsyncStorage.getItem(CACHE_KEYS.TRACKS);
      if (tracks) {
        const tracksData = JSON.parse(tracks);
        stats.tracks = {
          count: tracksData.data.length,
          age: Date.now() - tracksData.timestamp,
          expired: Date.now() - tracksData.timestamp > CACHE_EXPIRY.TRACKS,
        };
      }

      // Count user data
      stats.userFavorites = allKeys.filter(key => key.startsWith(CACHE_KEYS.USER_FAVORITES)).length;
      stats.userProgress = allKeys.filter(key => key.startsWith(CACHE_KEYS.USER_PROGRESS)).length;

      // Check pending operations
      const pending = await this.getPendingOperations();
      stats.pendingOperations = pending.length;

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
};