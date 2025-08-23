import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, getAuth } from 'firebase/auth';
import { auth, handleFirebaseError, logFirebaseOperation, isNetworkError } from '../config/firebaseConfig';
import { userService } from '../services/userService';
import { seedDataService } from '../services/seedData';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safely import NetInfo with fallback
let NetInfo = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (error) {
  console.warn('NetInfo not available, using fallback network detection');
}

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        logFirebaseOperation('AuthProvider', 'Initializing authentication');
        
        // Check network connectivity
        if (NetInfo) {
          const netInfo = await NetInfo.fetch();
          setIsOnline(netInfo.isConnected);
        } else {
          // Fallback: assume online if NetInfo not available
          setIsOnline(true);
        }
        
        // Check guest status
        const guestStatus = await AsyncStorage.getItem('isGuest');
        setIsGuest(guestStatus === 'true');
        
        // Initialize sample data if needed (only when online)
        if (NetInfo ? netInfo.isConnected : true) {
          try {
            await seedDataService.initializeAllSampleData();
          } catch (error) {
            console.warn('Could not initialize sample data:', error);
          }
        }
        
        const isOnlineStatus = NetInfo ? netInfo.isConnected : true;
        logFirebaseOperation('AuthProvider', `Initialization complete - Guest: ${guestStatus === 'true'}, Online: ${isOnlineStatus}`);
      } catch (error) {
        const friendlyMessage = handleFirebaseError(error, 'Initializing authentication');
        setAuthError(friendlyMessage);
        console.error('Error during auth initialization:', error);
      }
    };

    initializeAuth();

    // Listen to network state changes
    let unsubscribeNetInfo = null;
    if (NetInfo) {
      unsubscribeNetInfo = NetInfo.addEventListener(state => {
        logFirebaseOperation('NetworkState', `Connection: ${state.isConnected}`);
        setIsOnline(state.isConnected);
        
        if (state.isConnected && authError && isNetworkError(authError)) {
          // Clear network-related errors when back online
          setAuthError(null);
        }
      });
    }

    // Listen to authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        logFirebaseOperation('AuthStateChange', user ? `User signed in: ${user.uid}` : 'User signed out');
        setUser(user);
        setAuthError(null); // Clear auth errors on successful state change
        
        if (user && !isGuest) {
          // User is authenticated, load their profile
          await loadUserProfile(user.uid);
        } else {
          // User is not authenticated or is guest
          setUserProfile(null);
        }
      } catch (error) {
        const friendlyMessage = handleFirebaseError(error, 'Authentication state change');
        setAuthError(friendlyMessage);
        setUserProfile(null);
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNetInfo();
    };
  }, [isGuest]);

  const loadUserProfile = async (userId) => {
    try {
      logFirebaseOperation('loadUserProfile', `Loading profile for user ${userId}`);
      
      if (!isOnline) {
        // Try to load from local cache if offline
        const cachedProfile = await getCachedUserProfile(userId);
        if (cachedProfile) {
          setUserProfile(cachedProfile);
          return;
        }
      }

      // Check if user profile exists
      const profileExists = await userService.userProfileExists(userId);
      
      if (profileExists) {
        const profile = await userService.getUserProfile(userId);
        setUserProfile(profile);
        
        // Cache profile locally
        await cacheUserProfile(userId, profile);
        logFirebaseOperation('loadUserProfile', 'Profile loaded and cached successfully');
      } else {
        // Create user profile if it doesn't exist using enhanced seed data
        const newProfile = await seedDataService.createSampleUserProfile(userId, {
          email: user?.email || '',
          displayName: user?.displayName || '',
        });
        setUserProfile(newProfile);
        
        // Cache new profile locally
        await cacheUserProfile(userId, newProfile);
        logFirebaseOperation('loadUserProfile', 'New profile created and cached');
      }
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Loading user profile');
      setAuthError(friendlyMessage);
      
      // Try to fall back to cached profile
      const cachedProfile = await getCachedUserProfile(userId);
      if (cachedProfile) {
        setUserProfile(cachedProfile);
        logFirebaseOperation('loadUserProfile', 'Using cached profile due to error');
      }
    }
  };

  // Helper function to cache user profile locally
  const cacheUserProfile = async (userId, profile) => {
    try {
      await AsyncStorage.setItem(`userProfile_${userId}`, JSON.stringify(profile));
    } catch (error) {
      console.warn('Failed to cache user profile:', error);
    }
  };

  // Helper function to get cached user profile
  const getCachedUserProfile = async (userId) => {
    try {
      const cached = await AsyncStorage.getItem(`userProfile_${userId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to get cached user profile:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      logFirebaseOperation('logout', 'User signing out');
      
      // Clear cached data
      if (user) {
        await AsyncStorage.removeItem(`userProfile_${user.uid}`);
      }
      
      await signOut(auth);
      await AsyncStorage.removeItem('isGuest');
      
      setUser(null);
      setUserProfile(null);
      setIsGuest(false);
      setAuthError(null);
      
      logFirebaseOperation('logout', 'User signed out successfully');
    } catch (error) {
      const friendlyMessage = handleFirebaseError(error, 'Signing out');
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const setGuestMode = async (guestMode = true) => {
    try {
      await AsyncStorage.setItem('isGuest', guestMode.toString());
      setIsGuest(guestMode);
      
      if (guestMode) {
        // Clear user data when switching to guest mode
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error setting guest mode:', error);
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user || isGuest) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      await userService.updateUserProfile(user.uid, updates);
      // Refresh user profile
      await loadUserProfile(user.uid);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const recordSession = async (durationMinutes) => {
    if (!user || isGuest) {
      return; // Guest users don't record sessions
    }

    try {
      await userService.updateSessionStats(user.uid, durationMinutes);
      await userService.updateStreak(user.uid);
      // Refresh user profile to get updated stats
      await loadUserProfile(user.uid);
    } catch (error) {
      console.error('Error recording session:', error);
    }
  };

  const value = {
    // Auth state
    user,
    userProfile,
    loading,
    isGuest,
    isOnline,
    authError,
    initializing,
    
    // Auth methods
    logout,
    setGuestMode,
    updateUserProfile,
    recordSession,
    loadUserProfile,
    
    // Error handling
    clearAuthError: () => setAuthError(null),
    
    // Computed values
    isAuthenticated: !!user && !isGuest,
    isPremium: userProfile?.isPremium || false,
    hasConnectionIssues: !isOnline || (authError && isNetworkError({ message: authError })),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};