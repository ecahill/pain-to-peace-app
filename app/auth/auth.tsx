import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AuthScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Replace this with real login logic later
        console.log('Logging in with', email, password);
        router.push('/home'); // placeholder destination
    };

    const handleSignup = () => {
        console.log('Signing up with', email, password);
        router.push('/home');
    };

    const handleGuest = () => {
        console.log('Continuing as guest');
        router.push('/home');
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
            <Button title="Log In" onPress={handleLogin} />
            <Button title="Sign Up" onPress={handleSignup} />
            <Button title="Continue as Guest" onPress={handleGuest} />
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
