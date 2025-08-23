// app/login.tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        console.log('🔑 Login screen - Login attempt started');
        console.log('📧 Email:', email);
        console.log('🔒 Password length:', password.length);
        
        if (!email.trim() || !password.trim()) {
            console.log('❌ Login failed: Empty email or password');
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            console.log('🚀 Attempting Firebase signInWithEmailAndPassword...');
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            console.log('✅ Firebase login successful!');
            console.log('👤 User ID:', userCredential.user.uid);
            console.log('📧 User email:', userCredential.user.email);
            
            await AsyncStorage.setItem('isGuest', 'false');
            console.log('💾 Guest status set to false');
            
            console.log('🧭 Navigating to tabs...');
            router.push('/(tabs)');
        } catch (error: any) {
            console.error('❌ Firebase login error:', error);
            console.error('🏷️  Error code:', error.code);
            console.error('📝 Error message:', error.message);
            
            const errorMessage = error.code === 'auth/invalid-credential' 
                ? 'Invalid email or password'
                : error.code === 'auth/user-not-found'
                ? 'No account found with this email'
                : error.code === 'auth/wrong-password'
                ? 'Incorrect password'
                : error.code === 'auth/too-many-requests'
                ? 'Too many failed attempts. Please try again later.'
                : 'Login failed. Please try again.';
            Alert.alert('Login Error', errorMessage);
        } finally {
            setLoading(false);
            console.log('🏁 Login attempt finished');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log In</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
                value={email}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
            />

            <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Log In</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.link}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6fbff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 30,
        color: '#2e2e2e',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#dcdcdc',
    },
    button: {
        backgroundColor: '#3f7be6',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginTop: 10,
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    link: {
        color: '#3f7be6',
        marginTop: 20,
        fontSize: 14,
    },
});
