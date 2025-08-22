import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import 'react-native-reanimated';

export default function Layout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false, // optional: hide headers across all screens
        }}
      />
    </AuthProvider>
  );
}