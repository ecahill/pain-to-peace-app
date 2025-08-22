import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

export default function AuthScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            await AsyncStorage.setItem('isGuest', 'false');
            router.push('/(tabs)');
        } catch (error: any) {
            const errorMessage = error.code === 'auth/invalid-credential' 
                ? 'Invalid email or password'
                : error.code === 'auth/user-not-found'
                ? 'No account found with this email'
                : error.code === 'auth/wrong-password'
                ? 'Incorrect password'
                : 'Login failed. Please try again.';
            Alert.alert('Login Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email.trim(), password);
            await AsyncStorage.setItem('isGuest', 'false');
            router.push('/(tabs)');
        } catch (error: any) {
            const errorMessage = error.code === 'auth/email-already-in-use'
                ? 'An account with this email already exists'
                : error.code === 'auth/invalid-email'
                ? 'Please enter a valid email address'
                : error.code === 'auth/weak-password'
                ? 'Password is too weak'
                : 'Signup failed. Please try again.';
            Alert.alert('Signup Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        await AsyncStorage.setItem('isGuest', 'true');
        router.push('/(tabs)');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log In or Sign Up</Text>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />
            <Button title="Log In" onPress={handleLogin} disabled={loading} />
            <Button title="Sign Up" onPress={handleSignup} disabled={loading} />
            <Button title="Continue as Guest" onPress={handleGuest} disabled={loading} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginBottom: 16,
        borderRadius: 8,
    },
});
