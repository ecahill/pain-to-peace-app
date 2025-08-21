// Firebase connection test utility
import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Test Firebase Firestore connection
 * This function attempts to read from a test collection to verify the connection
 * @returns {Promise<boolean>} Returns true if connection is successful, false otherwise
 */
export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Try to read from a test collection
    // This will work even if the collection doesn't exist
    const testCollectionRef = collection(db, 'test');
    const snapshot = await getDocs(testCollectionRef);
    
    console.log('✅ Firebase connection successful!');
    console.log(`📊 Test collection contains ${snapshot.size} documents`);
    
    // Log some additional info
    console.log('🏗️  Firebase project:', db.app.options.projectId);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    console.error('🔧 Please check your Firebase configuration in .env file');
    
    // Log specific error types for easier debugging
    if (error.code === 'permission-denied') {
      console.error('🔒 Permission denied - check your Firestore security rules');
    } else if (error.code === 'unavailable') {
      console.error('🌐 Network error - check your internet connection');
    } else if (error.message.includes('project')) {
      console.error('🎯 Project configuration error - verify your project ID');
    }
    
    return false;
  }
};

/**
 * Test Firebase Auth connection
 * This function checks if Firebase Auth is properly initialized
 * @returns {Promise<boolean>} Returns true if auth is initialized, false otherwise
 */
export const testFirebaseAuth = async () => {
  try {
    const { auth } = await import('../config/firebase');
    console.log('🔐 Firebase Auth initialized successfully');
    console.log('👤 Current user:', auth.currentUser ? 'Logged in' : 'Not logged in');
    return true;
  } catch (error) {
    console.error('❌ Firebase Auth initialization failed:', error.message);
    return false;
  }
};

/**
 * Test Firebase Storage connection
 * This function checks if Firebase Storage is properly initialized
 * @returns {Promise<boolean>} Returns true if storage is initialized, false otherwise
 */
export const testFirebaseStorage = async () => {
  try {
    const { storage } = await import('../config/firebase');
    console.log('📁 Firebase Storage initialized successfully');
    console.log('🗄️  Storage bucket:', storage.app.options.storageBucket);
    return true;
  } catch (error) {
    console.error('❌ Firebase Storage initialization failed:', error.message);
    return false;
  }
};

/**
 * Run all Firebase tests
 * This function runs all available Firebase service tests
 * @returns {Promise<Object>} Returns an object with test results for each service
 */
export const runAllFirebaseTests = async () => {
  console.log('🚀 Running comprehensive Firebase tests...\n');
  
  const results = {
    firestore: await testFirebaseConnection(),
    auth: await testFirebaseAuth(),
    storage: await testFirebaseStorage(),
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('\n📋 Test Results Summary:');
  console.log('Firestore:', results.firestore ? '✅ PASS' : '❌ FAIL');
  console.log('Auth:', results.auth ? '✅ PASS' : '❌ FAIL');
  console.log('Storage:', results.storage ? '✅ PASS' : '❌ FAIL');
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return results;
};