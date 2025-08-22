import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../app/firebase/firebaseConfig';
import { userService } from '../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check guest status
        const guestStatus = await AsyncStorage.getItem('isGuest');
        setIsGuest(guestStatus === 'true');
      } catch (error) {
        console.error('Error checking guest status:', error);
      }
    };

    initializeAuth();

    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        
        if (user && !isGuest) {
          // User is authenticated, load their profile
          await loadUserProfile(user.uid);
        } else {
          // User is not authenticated or is guest
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isGuest]);

  const loadUserProfile = async (userId) => {
    try {
      // Check if user profile exists
      const profileExists = await userService.userProfileExists(userId);
      
      if (profileExists) {
        const profile = await userService.getUserProfile(userId);
        setUserProfile(profile);
      } else {
        // Create user profile if it doesn't exist
        const newProfile = await userService.createUserProfile(userId, {
          email: user?.email || '',
          displayName: user?.displayName || '',
        });
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If profile loading fails, create a basic profile
      try {
        const basicProfile = await userService.createUserProfile(userId, {
          email: user?.email || '',
        });
        setUserProfile(basicProfile);
      } catch (createError) {
        console.error('Error creating user profile:', createError);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('isGuest');
      setUser(null);
      setUserProfile(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
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
    
    // Auth methods
    logout,
    setGuestMode,
    updateUserProfile,
    recordSession,
    loadUserProfile,
    
    // Computed values
    isAuthenticated: !!user && !isGuest,
    isPremium: userProfile?.isPremium || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};