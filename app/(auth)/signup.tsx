import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { auth, db } from "../../config/firebase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const router = useRouter();

  // Refined Facebook Dark Mode Palette
  const COLORS = {
    bg: "#18191a",
    card: "#242526",
    primary: "#2d88ff",
    text: "#e4e6eb",
    secondary: "#b0b3b8",
    inputBg: "#3a3b3c",
    border: "#4e4f50",
    accentBg: "rgba(45, 136, 255, 0.15)", // Subtle blue tint for active state
  };

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please fill out all fields.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
      });

      console.log("Account created successfully!");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
    }
  };

  const RoleButton = ({ title, value }: { title: string; value: string }) => {
    const isActive = role === value;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.roleBtn,
          { borderColor: isActive ? COLORS.primary : COLORS.border },
          isActive && { backgroundColor: COLORS.accentBg },
        ]}
        onPress={() => setRole(value)}
      >
        <Text
          style={[
            styles.roleText,
            { color: isActive ? COLORS.primary : COLORS.secondary },
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: COLORS.bg }]}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <Text style={[styles.header, { color: COLORS.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subHeader, { color: COLORS.secondary }]}>
            Join the WingzRide network today.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: COLORS.secondary }]}>
              EMAIL ADDRESS
            </Text>
            <TextInput
              placeholder="name@example.com"
              placeholderTextColor="#7a7a7a"
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              style={[
                styles.input,
                {
                  backgroundColor: COLORS.inputBg,
                  color: COLORS.text,
                  borderColor: COLORS.border,
                },
              ]}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: COLORS.secondary }]}>
              PASSWORD
            </Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#7a7a7a"
              secureTextEntry
              onChangeText={setPassword}
              style={[
                styles.input,
                {
                  backgroundColor: COLORS.inputBg,
                  color: COLORS.text,
                  borderColor: COLORS.border,
                },
              ]}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.label,
                { color: COLORS.secondary, marginTop: 10 },
              ]}
            >
              I AM A...
            </Text>
            <View style={styles.roleContainer}>
              <RoleButton title="Client" value="client" />
              <RoleButton title="Driver" value="driver" />
              <RoleButton title="Dispatcher" value="dispatcher" />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.mainBtn, { backgroundColor: COLORS.primary }]}
            onPress={handleSignup}
          >
            <Text style={styles.mainBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.footer}
          onPress={() => router.replace("/(auth)/login" as any)}
        >
          <Text style={[styles.footerText, { color: COLORS.secondary }]}>
            Already have an account?{" "}
            <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
              Log In
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  headerSection: {
    marginBottom: 40,
  },
  header: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  form: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  input: {
    height: 58,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 35,
  },
  roleBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  roleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  mainBtn: {
    height: 58,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  mainBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
  },
});