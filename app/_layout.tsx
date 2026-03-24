import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // FB Dark Palette
  const COLORS = {
    bg: '#18191a',
    primary: '#2d88ff',
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ ...firebaseUser, role: userData?.role });
          } else {
            // Document might not be created yet during signup flow
            setUser(firebaseUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Layout Auth Error:", error);
      } finally {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to signup if not authenticated
      router.replace('/(auth)/signup' as any);
    } else if (user && inAuthGroup && user.role) {
      // Redirect based on the specific directory names in your structure
      const roleFolder = user.role === 'driver' ? '(driver)' : 
                         user.role === 'dispatcher' ? '(dispatcher)' : '(client)';
      
      router.replace(`/${roleFolder}/home` as any);
    }
  }, [user, segments, initializing]);

  // Use the Dark Mode theme for the loading screen
  if (initializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.bg }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg } 
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/signup" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});