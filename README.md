# Pain to Peace

A mind-body companion app for chronic pain relief. Pain to Peace offers a library of guided audio sessions across three categories: **Sleep**, **Pain**, and **Anxiety** — with favorites, listening progress, and offline support.

Built with [Expo](https://expo.dev) and React Native, it runs on iOS, Android, and the web from a single codebase, backed by Firebase for auth, data, and media storage.

> **Status:** Work in progress. The core navigation, authentication, track library, favorites, and offline caching are implemented. The player screen is currently a UI shell, audio playback is not yet wired up, and some profile statistics are still placeholders.

## Features

- **Track library** — browse guided sessions, filter by category, and search by title or description
- **Favorites** — save tracks to a personal list, synced to your account
- **Progress tracking** — per-track listening progress, session counts, and streaks
- **Authentication** — email/password sign up and login via Firebase Auth, plus a guest mode that skips account creation
- **Offline support** — tracks, favorites, and progress are cached locally with AsyncStorage; writes made while offline are queued and replayed when the connection returns
- **Free and premium tracks** — tracks carry an `isFree` flag, and user profiles carry premium status
- **Theming** — light and dark color schemes, with haptic tab feedback and native blur effects on iOS

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Expo SDK 53, React Native 0.79, React 19 |
| Language | TypeScript (screens/components) and JavaScript (services/contexts) |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction) with file-based routing and typed routes |
| Backend | Firebase — Authentication, Cloud Firestore, Cloud Storage |
| Local storage | AsyncStorage, NetInfo for connectivity detection |
| Linting | ESLint with `eslint-config-expo` |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- A [Firebase](https://console.firebase.google.com/) project
- For device testing: the [Expo Go](https://expo.dev/go) app, or Xcode / Android Studio for simulators

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

Create a Firebase project, then enable:

- **Authentication** with the Email/Password provider
- **Cloud Firestore**
- **Cloud Storage**

Copy the web app config from **Project Settings → General → Your apps**.

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

All six variables are required — the app validates them at startup and fails fast with a descriptive error if any are missing. `.env` is gitignored and should never be committed.

The `EXPO_PUBLIC_` prefix means these values are bundled into the client. That is expected for Firebase web config, which is not secret; access control is enforced by the security rules, not by hiding these keys.

### 4. Deploy security rules

The repository includes Firestore and Storage rules. Deploy them with the [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
firebase deploy --only firestore:rules,storage
```

Update the project ID in `.firebaserc` to point at your own Firebase project first.

### 5. Run the app

```bash
npm start        # start the Expo dev server
npm run ios      # open in the iOS simulator
npm run android  # open in the Android emulator
npm run web      # open in a browser
```

## Available scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the Expo development server |
| `npm run ios` | Launch on the iOS simulator |
| `npm run android` | Launch on the Android emulator |
| `npm run web` | Launch in a web browser |
| `npm run lint` | Run ESLint |
| `npm run reset-project` | Move the current app to `app-example/` and scaffold a blank `app/` directory |

## Project structure

```
app/                  Screens and routes (Expo Router file-based routing)
  index.tsx           Welcome screen — sign up, log in, or continue as guest
  auth/               Login and sign up screens
  (tabs)/             Main tab navigator: Library, Favorites, Profile
  player.tsx          Audio player screen
components/           Shared and themed UI components
config/               Firebase initialization, validation, and error handling
contexts/             AuthContext — auth state, guest mode, profile loading
services/             Firestore access layer
  audioService.js     Tracks, favorites, search, listening progress
  userService.js      User profiles, stats, streaks, preferences
  offlineService.js   Caching, cache expiry, and pending-operation queue
  seedData.js         Schema documentation and sample data seeding
hooks/                Color scheme and theming hooks
constants/            Color palette
firestore.rules       Firestore security rules
firebase-storage.rules  Storage security rules
```

## Data model

Firestore collections used by the app:

| Collection | Contents |
| --- | --- |
| `tracks` | Guided audio sessions — title, description, duration, category, audio and image URLs, `isFree`, tags, play count, rating |
| `users` | User profiles — email, display name, premium status, preferences, aggregate stats, favorites |
| `userProgress` | Per-user, per-track progress — percentage, completion, total play time, session count |
| `userSessions/{userId}/sessions` | Individual listening sessions |
| `appSettings` | Application-wide settings (read-only to clients) |
| `admin` | Admin-only documents |

Field-level schemas are documented in [services/seedData.js](services/seedData.js).

## Security

Firestore rules enforce that users can only read and write their own profile, progress, and session data, while tracks are publicly readable and write-restricted. Storage rules are locked down by default and should be opened deliberately for the paths your deployment needs.

Two supporting documents cover this in more depth:

- [FIREBASE_SECURITY_GUIDE.md](FIREBASE_SECURITY_GUIDE.md) — rules design and hardening checklist
- [FIREBASE_IMPLEMENTATION_SUMMARY.md](FIREBASE_IMPLEMENTATION_SUMMARY.md) — how Firebase is wired into the app

If you fork this project, use your own Firebase project and deploy your own rules before shipping anything.

## Disclaimer

Pain to Peace is a wellness and relaxation tool. It is not a medical device and does not provide medical advice, diagnosis, or treatment. Consult a qualified healthcare provider about any medical condition, including chronic pain.

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` before opening a PR.

## License

[MIT](LICENSE) © Emily Cahill
