import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/alert';

const getErrorMessage = (errorMsg: string): string => {
  if (errorMsg.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (errorMsg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (errorMsg.includes('Unable to validate email') || errorMsg.includes('invalid')) {
    return 'Please enter a valid email address.';
  }
  if (errorMsg.includes('rate limit') || errorMsg.includes('Too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return errorMsg;
};

export const SignUpScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!email.trim()) {
      showAlert('Missing Email', 'Please enter your email address.');
      return;
    }
    if (!password) {
      showAlert('Missing Password', 'Please enter a password.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);

    if (error) {
      showAlert('Sign Up Failed', getErrorMessage(error.message));
    }
    // If email confirmation is off, user is auto-signed in and
    // RootNavigator will redirect to Onboarding automatically.
    // If email confirmation is on, show a message:
    // Alert.alert('Check Your Email', 'We sent a confirmation link to your email.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scroly</Text>
      <Text style={styles.subtitle}>Create a new account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.link}
        disabled={loading}
      >
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#7C3AED',
    fontSize: 14,
  },
});

export default SignUpScreen;
