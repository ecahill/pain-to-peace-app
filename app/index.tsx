import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WelcomeScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Pain to Peace™</Text>
            <Text style={styles.subtitle}>Your mind-body companion for pain relief.</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Signup')}
            >
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.secondaryButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('GuestFlow')}>
                <Text style={styles.guestText}>Continue as Guest</Text>
            </TouchableOpacity>
        </View>
    );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f5faff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        color: '#2a4d69',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#5d6d7e',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#2a4d69',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginBottom: 16,
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    secondaryButton: {
        backgroundColor: '#e1ecf4',
    },
    secondaryButtonText: {
        color: '#2a4d69',
        fontSize: 16,
        textAlign: 'center',
    },
    guestText: {
        marginTop: 20,
        fontSize: 14,
        color: '#7f8c8d',
        textDecorationLine: 'underline',
    },
});
