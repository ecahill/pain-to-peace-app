import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDq3dtLqGpzP1MKqmYEQv5K9F53q4ehgJ0",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "pain-to-peace.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "pain-to-peace",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "pain-to-peace.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "803224433859",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:803224433859:web:c84fa64ccf8f0068201e76",
    measurementId: "G-5KMV63PFYL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// =============================================================================
// DEVELOPMENT EMULATOR CONFIGURATION
// =============================================================================

/**
 * Check if we're running in development mode
 * Works for both React Native and Expo Web
 */
const isDevelopment = (): boolean => {
  // For Expo/React Native
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }
  
  // For web development
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('192.168.') ||
           process.env.NODE_ENV === 'development';
  }
  
  // Fallback for other environments
  return process.env.NODE_ENV === 'development';
};

/**
 * Connect to Firebase emulators in development
 */
const connectToEmulators = () => {
  try {
    // Check if emulators are already connected to avoid reconnection errors
    if ((auth as any)._delegate?.emulator) {
      console.log('🔧 Firebase emulators already connected');
      return;
    }

    // Connect to Authentication emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Connect to Storage emulator (using port 9199 as default)
    connectStorageEmulator(storage, 'localhost', 9199);
    
    console.log('🔧 Successfully connected to Firebase emulators:');
    console.log('   📧 Auth: http://localhost:9099');
    console.log('   🗄️  Firestore: localhost:8080');
    console.log('   📁 Storage: localhost:9199');
    console.log('');
    console.log('🚀 To start emulators, run: firebase emulators:start');
    
  } catch (error) {
    console.warn('⚠️ Failed to connect to Firebase emulators:', error.message);
    console.warn('   Using production Firebase instead');
    console.warn('   To use emulators, run: firebase emulators:start');
  }
};

// Automatically connect to emulators in development
if (isDevelopment()) {
  console.log('🛠️ Development mode detected - attempting to connect to Firebase emulators');
  connectToEmulators();
} else {
  console.log('🌐 Production mode - using live Firebase services');
}

// =============================================================================
// FIREBASE ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Enhanced error handler for Firebase operations
 * Provides user-friendly error messages and detailed logging
 */
export const handleFirebaseError = (error: any, operation: string = 'Firebase operation') => {
  console.error(`❌ ${operation} failed:`, error);
  
  // Log detailed error information
  if (error.code) console.error('🏷️ Error code:', error.code);
  if (error.message) console.error('📝 Error message:', error.message);
  
  // Return user-friendly error messages based on error codes
  switch (error.code) {
    // Authentication errors
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials.';
    
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    
    // Firestore errors
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    
    case 'not-found':
      return 'The requested data was not found.';
    
    case 'already-exists':
      return 'This data already exists.';
    
    case 'resource-exhausted':
      return 'Service temporarily unavailable. Please try again later.';
    
    case 'failed-precondition':
      return 'Operation failed due to current system state.';
    
    case 'aborted':
      return 'Operation was aborted. Please try again.';
    
    case 'out-of-range':
      return 'Invalid input parameters.';
    
    case 'unimplemented':
      return 'This feature is not yet available.';
    
    case 'internal':
      return 'Internal server error. Please try again later.';
    
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again later.';
    
    case 'data-loss':
      return 'Data corruption detected. Please contact support.';
    
    // Storage errors
    case 'storage/object-not-found':
      return 'File not found.';
    
    case 'storage/bucket-not-found':
      return 'Storage bucket not found.';
    
    case 'storage/project-not-found':
      return 'Project not found.';
    
    case 'storage/quota-exceeded':
      return 'Storage quota exceeded.';
    
    case 'storage/unauthenticated':
      return 'Please sign in to upload files.';
    
    case 'storage/unauthorized':
      return 'You do not have permission to access this file.';
    
    case 'storage/retry-limit-exceeded':
      return 'Upload failed after multiple attempts. Please try again.';
    
    case 'storage/invalid-checksum':
      return 'File upload was corrupted. Please try again.';
    
    case 'storage/canceled':
      return 'Upload was canceled.';
    
    case 'storage/invalid-event-name':
      return 'Invalid upload event.';
    
    case 'storage/invalid-url':
      return 'Invalid file URL.';
    
    case 'storage/invalid-argument':
      return 'Invalid file parameters.';
    
    case 'storage/no-default-bucket':
      return 'No default storage bucket configured.';
    
    case 'storage/cannot-slice-blob':
      return 'File upload error. Please try again.';
    
    case 'storage/server-file-wrong-size':
      return 'File size mismatch. Please try again.';
    
    // Generic errors
    default:
      return `Something went wrong with ${operation.toLowerCase()}. Please try again.`;
  }
};

/**
 * Check if error is due to permission denied
 */
export const isPermissionDeniedError = (error: any): boolean => {
  return error.code === 'permission-denied' || 
         error.code === 'storage/unauthorized' ||
         error.code === 'auth/insufficient-permission';
};

/**
 * Check if error is due to network issues
 */
export const isNetworkError = (error: any): boolean => {
  return error.code === 'auth/network-request-failed' ||
         error.code === 'unavailable' ||
         error.message?.includes('network') ||
         error.message?.includes('offline');
};

/**
 * Check if error requires user to sign in
 */
export const requiresAuthentication = (error: any): boolean => {
  return error.code === 'storage/unauthenticated' ||
         error.code === 'unauthenticated' ||
         error.code === 'auth/user-not-found';
};

/**
 * Log Firebase operation for debugging
 */
export const logFirebaseOperation = (operation: string, details?: any) => {
  console.log(`🔥 Firebase ${operation}`, details || '');
};

// =============================================================================
// CONFIGURATION VALIDATION
// =============================================================================

/**
 * Validate Firebase configuration
 */
export const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 
    'messagingSenderId', 'appId'
  ];
  
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase config fields:', missingFields);
    throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`);
  }
  
  console.log('✅ Firebase configuration validated');
  return true;
};

// Validate configuration on import
try {
  validateFirebaseConfig();
} catch (error) {
  console.error('🚨 Firebase configuration error:', error);
}