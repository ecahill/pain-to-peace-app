// app/auth/signup.tsx
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebaseConfig';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        console.log('🔑 Signup screen - Signup attempt started');
        console.log('📧 Email:', email);
        console.log('🔒 Password length:', password.length);
        
        if (!email.trim() || !password.trim()) {
            console.log('❌ Signup failed: Empty email or password');
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            console.log('🚀 Attempting Firebase createUserWithEmailAndPassword...');
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            console.log('✅ Firebase signup successful!');
            console.log('👤 User ID:', userCredential.user.uid);
            console.log('📧 User email:', userCredential.user.email);
            
            Alert.alert('Success', 'Account created!');
            console.log('🧭 Navigating to tabs...');
            router.replace('/(tabs)'); // Redirect to main app screen
        } catch (error: any) {
            console.error('❌ Firebase signup error:', error);
            console.error('🏷️  Error code:', error.code);
            console.error('📝 Error message:', error.message);
            
            const errorMessage = error.code === 'auth/email-already-in-use'
                ? 'An account with this email already exists'
                : error.code === 'auth/weak-password'
                ? 'Password is too weak. Please choose a stronger password.'
                : error.code === 'auth/invalid-email'
                ? 'Please enter a valid email address'
                : error.code === 'auth/too-many-requests'
                ? 'Too many failed attempts. Please try again later.'
                : 'Signup failed. Please try again.';
            Alert.alert('Signup Error', errorMessage);
        } finally {
            setLoading(false);
            console.log('🏁 Signup attempt finished');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>

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
                onPress={handleSignup}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.link}>Already have an account? Log in</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Signup;

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
