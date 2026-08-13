import { FirebaseApp, FirebaseOptions, initializeApp } from "firebase/app";
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

// =============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// =============================================================================

interface RequiredEnvVars {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
const validateEnvironmentVariables = (): RequiredEnvVars => {
  const requiredVars: Array<keyof RequiredEnvVars> = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const envVarMap = {
    apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
    authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'EXPO_PUBLIC_FIREBASE_APP_ID'
  };

  const missingVars: string[] = [];
  const config: Partial<RequiredEnvVars> = {};

  // Check each required environment variable
  for (const key of requiredVars) {
    const envVar = envVarMap[key];
    const value = process.env[envVar];

    if (!value || value.trim() === '') {
      missingVars.push(envVar);
    } else {
      config[key] = value.trim();
    }
  }

  // Throw detailed error if any variables are missing
  if (missingVars.length > 0) {
    const errorMessage = [
      '🚨 Firebase Configuration Error: Missing required environment variables',
      '',
      'Missing variables:',
      ...missingVars.map(varName => `  ❌ ${varName}`),
      '',
      'To fix this:',
      '1. Check your .env file in the project root',
      '2. Ensure all EXPO_PUBLIC_FIREBASE_* variables are set',
      '3. Get these values from Firebase Console > Project Settings > General',
      '4. Restart your development server after updating .env',
      '',
      'Required .env format:',
      'EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here',
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id',
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com',
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789',
      'EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456',
    ].join('\n');

    throw new Error(errorMessage);
  }

  return config as RequiredEnvVars;
};

/**
 * Create Firebase configuration from validated environment variables
 */
const createFirebaseConfig = (): FirebaseOptions => {
  console.log('🔧 Loading Firebase configuration from environment variables...');

  const envConfig = validateEnvironmentVariables();

  const firebaseConfig: FirebaseOptions = {
    apiKey: envConfig.apiKey,
    authDomain: envConfig.authDomain,
    projectId: envConfig.projectId,
    storageBucket: envConfig.storageBucket,
    messagingSenderId: envConfig.messagingSenderId,
    appId: envConfig.appId,
  };

  console.log('✅ Firebase configuration loaded successfully');
  console.log(`📊 Project ID: ${firebaseConfig.projectId}`);
  console.log(`🔐 Auth Domain: ${firebaseConfig.authDomain}`);

  return firebaseConfig;
};

// =============================================================================
// FIREBASE INITIALIZATION
// =============================================================================

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  // Create and validate configuration
  const firebaseConfig = createFirebaseConfig();

  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firebase services - always connecting to real Firebase
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('🔥 Firebase services initialized successfully');
  console.log('🌐 Connected to production Firebase services');
  console.log('   📧 Auth: Firebase Authentication');
  console.log('   🗄️  Firestore: Cloud Firestore');
  console.log('   📁 Storage: Firebase Storage');
} catch (error) {
  console.error('💥 Firebase initialization failed:', error);
  throw error; // Re-throw to prevent app from starting with broken Firebase
}

// Export initialized services
export { auth, db, storage };


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
// CONFIGURATION VALIDATION (LEGACY SUPPORT)
// =============================================================================

/**
 * Legacy validation function - kept for backward compatibility
 * The actual validation now happens during initialization above
 */
export const validateFirebaseConfig = () => {
  console.log('✅ Firebase configuration validated (environment variables loaded)');
  return true;
};