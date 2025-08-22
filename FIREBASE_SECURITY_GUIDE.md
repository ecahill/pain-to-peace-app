# Firebase Security Rules Guide
## Pain to Peace Hypnosis App

### 📋 Table of Contents
1. [Security Model Overview](#security-model-overview)
2. [Firestore Security Rules](#firestore-security-rules)
3. [Storage Security Rules](#storage-security-rules)
4. [Implementation Guide](#implementation-guide)
5. [Testing Security Rules](#testing-security-rules)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Best Practices](#best-practices)

---

## 🔒 Security Model Overview

The Pain to Peace app follows a **hybrid public-private security model**:

### Public Content
- **Hypnosis track metadata** (titles, descriptions, categories)
- **Audio files** (publicly streamable for all users)
- **App configuration** (settings, public data)

### Private Content
- **User profiles** (personal information, preferences)
- **User favorites** (personally saved tracks)
- **Listening progress** (session data, completion stats)
- **User uploads** (personal audio files)

### Admin Content
- **Administrative data** (app management, analytics)
- **Track management** (uploading new content)

---

## 🗄️ Firestore Security Rules

### Collection Structure & Access Control

#### `/tracks/{trackId}` - Public Hypnosis Tracks
```javascript
// ✅ Anyone can READ track metadata
allow read: if true;

// ✅ Authenticated users can CREATE/UPDATE tracks
allow create, update: if request.auth != null;

// ✅ Only admins can DELETE tracks
allow delete: if isAdmin();
```

**Purpose**: Store public hypnosis track information
- Title, description, category, duration
- Free/premium status
- Audio file references

**Security Notes**:
- Public read access for browsing tracks
- Authenticated write prevents spam
- Admin-only deletion protects content integrity

#### `/users/{userId}` - User Profiles
```javascript
// ✅ Users can only access their OWN profile
allow read, create, update: if request.auth.uid == userId;

// ❌ Users CANNOT delete profiles
allow delete: if false;
```

**Purpose**: Store user personal information
- Email, display name, profile picture
- Premium status, preferences
- Usage statistics (sessions, streaks)
- Favorites list

**Security Notes**:
- Complete data isolation between users
- No profile deletion via Firestore (use Firebase Auth)
- Prevents data leakage and unauthorized access

#### `/userProgress/{userId}_{trackId}` - Listening Progress
```javascript
// ✅ Users can only access their OWN progress
allow read, write: if progressId.matches('^' + request.auth.uid + '_.*');
```

**Purpose**: Track listening progress per user/track
- Completion percentage (0-100%)
- Last played timestamp
- Session completion status

**Security Notes**:
- Document ID format enforces user isolation
- Regex pattern prevents access to other users' data
- Enables personal progress tracking

#### `/userSessions/{userId}/sessions/{sessionId}` - Session Analytics
```javascript
// ✅ Users can READ/CREATE their own sessions
allow read, create: if request.auth.uid == userId;

// ❌ Sessions are IMMUTABLE once created
allow update, delete: if false;
```

**Purpose**: Record individual listening sessions
- Start/end times, duration
- Track identification
- Completion status

**Security Notes**:
- Immutable sessions ensure data integrity
- Prevents tampering with analytics data
- Enables accurate usage tracking

#### `/admin/{document}` - Administrative Data
```javascript
// ✅ Only users with admin custom claims
allow read, write: if isAdmin();
```

**Purpose**: App management and configuration
- System settings, feature flags
- Analytics data, user reports
- Content moderation tools

#### `/appSettings/{setting}` - Public Configuration
```javascript
// ✅ Anyone can read app settings
allow read: if true;

// ✅ Only admins can modify settings
allow write: if isAdmin();
```

**Purpose**: Public app configuration
- Feature availability, API endpoints
- Public announcements, maintenance notices

---

## 📁 Storage Security Rules

### File Structure & Access Control

#### `/tracks/{trackId}/{fileName}` - Public Audio Files
```javascript
// ✅ Anyone can READ audio files
allow read: if true;

// ✅ Authenticated users can UPLOAD audio files
allow write: if request.auth != null && isValidAudioFile();
```

**Purpose**: Store publicly accessible hypnosis audio
- MP3, WAV, M4A, AAC, OGG, WebM formats
- 100MB file size limit
- Public streaming for all users

**Security Notes**:
- Public read enables streaming without auth
- Upload restrictions prevent abuse
- File type validation ensures quality

#### `/users/{userId}/profile.{ext}` - Profile Images
```javascript
// ✅ Anyone can read profile images
allow read: if true;

// ✅ Users can only upload to THEIR folder
allow write: if request.auth.uid == userId && isValidImageFile();
```

**Purpose**: User profile pictures
- JPEG, PNG, WebP formats
- 5MB file size limit
- Public visibility for social features

#### `/users/{userId}/uploads/{fileName}` - Private User Files
```javascript
// ✅ Users can only access THEIR uploads
allow read, write: if request.auth.uid == userId && isValidAudioFile();
```

**Purpose**: User-generated audio content
- Personal recordings, notes
- Private audio files
- Same format restrictions as public tracks

#### `/admin/{fileName}` - Administrative Files
```javascript
// ✅ Only admins can access
allow read, write: if isAdmin();
```

**Purpose**: Administrative content
- App assets, backup files
- Internal documentation

### File Validation Functions

#### Audio File Validation
```javascript
function isValidAudioFile() {
  return request.resource.contentType.matches('audio/.*') && (
    request.resource.contentType == 'audio/mpeg' ||      // .mp3
    request.resource.contentType == 'audio/wav' ||       // .wav
    request.resource.contentType == 'audio/mp4' ||       // .m4a
    // ... other supported formats
  );
}
```

#### File Size Validation
```javascript
function isValidFileSize() {
  return request.resource.size < 100 * 1024 * 1024; // 100MB limit
}
```

#### Filename Security
```javascript
function isValidFileName(fileName) {
  return fileName.matches('^[a-zA-Z0-9._-]+$') &&      // Safe characters only
         !fileName.matches('.*\\.\\..*') &&             // No path traversal
         fileName.size() < 255;                          // Reasonable length
}
```

---

## 🛠️ Implementation Guide

### 1. Deploy Security Rules

#### Firestore Rules
```bash
# Navigate to your project directory
cd path/to/pain-to-peace-app

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

#### Storage Rules
```bash
# Deploy Storage rules
firebase deploy --only storage
```

### 2. Set Up Admin Users

#### Add Admin Custom Claims (Node.js Admin SDK)
```javascript
const admin = require('firebase-admin');

// Initialize Admin SDK
admin.initializeApp();

// Add admin claim to user
await admin.auth().setCustomUserClaims(userId, { admin: true });
```

#### Verify Admin Status
```javascript
// In your app
const user = firebase.auth().currentUser;
const token = await user.getIdTokenResult();
const isAdmin = token.claims.admin === true;
```

### 3. Error Handling Integration

#### Use Enhanced Error Handling
```javascript
import { handleFirebaseError } from './firebase/firebaseConfig';

try {
  await audioService.addToFavorites(userId, trackId);
} catch (error) {
  const friendlyMessage = handleFirebaseError(error, 'Adding to favorites');
  Alert.alert('Error', friendlyMessage);
}
```

---

## 🧪 Testing Security Rules

### 1. Firebase Emulator Suite
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Start emulators with rules
firebase emulators:start --only firestore,storage
```

### 2. Unit Testing Security Rules

#### Firestore Rules Test Example
```javascript
const firebase = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  test('Users can read their own profile', async () => {
    const db = firebase.initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'user123' }
    }).firestore();
    
    const userDoc = db.collection('users').doc('user123');
    await firebase.assertSucceeds(userDoc.get());
  });
  
  test('Users cannot read other profiles', async () => {
    const db = firebase.initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'user123' }
    }).firestore();
    
    const otherUserDoc = db.collection('users').doc('user456');
    await firebase.assertFails(otherUserDoc.get());
  });
});
```

### 3. Manual Testing Checklist

#### ✅ Public Track Access
- [ ] Unauthenticated users can read tracks
- [ ] Unauthenticated users can stream audio
- [ ] Unauthenticated users cannot write tracks

#### ✅ User Profile Security
- [ ] Users can access own profile
- [ ] Users cannot access other profiles
- [ ] Authenticated users can update own profile

#### ✅ Favorites Isolation
- [ ] Users can manage own favorites
- [ ] Users cannot see others' favorites
- [ ] Guest users cannot save favorites

#### ✅ Admin Functionality
- [ ] Admin users can access admin collection
- [ ] Regular users cannot access admin data
- [ ] Admin users can delete tracks

---

## ⚠️ Common Issues & Solutions

### Issue 1: Permission Denied Errors
**Symptom**: Users getting "permission-denied" when accessing data
**Causes**:
- Missing authentication
- Incorrect document ID format
- User trying to access another user's data

**Solutions**:
```javascript
// Check authentication status
if (!firebase.auth().currentUser) {
  // Redirect to login
}

// Ensure correct document ID format
const progressId = `${userId}_${trackId}`;

// Use error handling
const friendlyMessage = handleFirebaseError(error);
```

### Issue 2: File Upload Failures
**Symptom**: Files failing to upload to Storage
**Causes**:
- File type not allowed
- File size too large
- Incorrect upload path

**Solutions**:
```javascript
// Validate file type before upload
const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('File type not supported');
}

// Check file size
if (file.size > 100 * 1024 * 1024) {
  throw new Error('File too large (max 100MB)');
}

// Use correct upload path
const uploadPath = `users/${userId}/uploads/${fileName}`;
```

### Issue 3: Data Validation Errors
**Symptom**: Documents failing to save due to validation
**Causes**:
- Missing required fields
- Invalid data types
- Field values outside allowed ranges

**Solutions**:
```javascript
// Ensure required fields
const trackData = {
  title: 'Track Title',
  description: 'Description',
  category: 'SLEEP', // Must be SLEEP, PAIN, or ANXIETY
  duration: '30 min', // Must match pattern
  isFree: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
```

---

## 🏆 Best Practices

### 1. Security-First Development
- **Test rules early** and often during development
- **Use emulators** for local testing
- **Implement proper error handling** from day one
- **Log security events** for monitoring

### 2. Data Design Patterns
- **User ID in document paths** for automatic isolation
- **Immutable session data** for analytics integrity
- **Separate collections** for different access patterns
- **Validate all input data** at the database level

### 3. Authentication Strategy
- **Require authentication** for all personal data
- **Use custom claims** for role-based access (admin)
- **Implement guest mode** carefully with limited access
- **Handle auth state changes** properly in your app

### 4. Performance Considerations
- **Use compound queries** efficiently
- **Implement pagination** for large collections
- **Cache public data** appropriately
- **Monitor read/write costs** regularly

### 5. Monitoring & Maintenance
- **Set up security alerts** for rule violations
- **Monitor authentication patterns** for anomalies
- **Regular security audits** of rules and data access
- **Keep rules documentation** updated

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Security rules tested with emulators
- [ ] All error handling implemented
- [ ] Admin users configured
- [ ] Data validation functions tested

### Deployment
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] App updated with error handling
- [ ] User feedback mechanisms tested

### Post-Deployment
- [ ] Monitor error logs for rule violations
- [ ] Test user flows in production
- [ ] Verify admin functionality
- [ ] Set up ongoing monitoring alerts

---

## 📞 Support & Resources

### Firebase Documentation
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)

### Testing Tools
- [Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### Monitoring
- [Firebase Console](https://console.firebase.google.com)
- [Cloud Logging](https://cloud.google.com/logging)

---

*Last updated: January 22, 2025*
*Version: 1.0.0*