import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, StatusBar, KeyboardAvoidingView, 
  Platform, ScrollView 
} from 'react-native';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter, Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Refined Facebook Dark Mode Palette
  const COLORS = {
    bg: '#18191a',
    card: '#242526',
    primary: '#2d88ff',
    text: '#e4e6eb',
    secondary: '#b0b3b8',
    inputBg: '#3a3b3c',
    border: '#4e4f50',
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: COLORS.bg }]}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={[styles.logoText, { color: COLORS.primary }]}>Wingz</Text>
          <Text style={[styles.tagline, { color: COLORS.secondary }]}>Your ride, simplified.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: COLORS.secondary }]}>EMAIL ADDRESS</Text>
            <TextInput
              style={[styles.input, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]}
              placeholder="name@example.com"
              placeholderTextColor="#7a7a7a"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: COLORS.secondary }]}>PASSWORD</Text>
            <TextInput
              style={[styles.input, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]}
              placeholder="••••••••"
              placeholderTextColor="#7a7a7a"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.loginButton, { backgroundColor: COLORS.primary }]} 
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: COLORS.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={{ color: COLORS.secondary, fontSize: 15 }}>New to WingzRide? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 15 }}>Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 28 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 50 
  },
  logoText: { 
    fontSize: 52, 
    fontWeight: '900', 
    letterSpacing: -1.5 
  },
  tagline: { 
    fontSize: 16, 
    fontWeight: '500', 
    marginTop: -5 
  },
  form: { 
    width: '100%' 
  },
  inputWrapper: {
    marginBottom: 20
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5
  },
  input: {
    width: '100%',
    height: 58,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    // Subtle shadow for button
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 20
  },
  forgotText: {
    fontWeight: '600'
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    marginTop: 40,
    paddingBottom: 20
  },
});