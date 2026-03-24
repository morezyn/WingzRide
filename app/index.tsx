import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth'; 
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  // Facebook Dark Mode Palette
  const COLORS = {
    bg: '#18191a',
    primary: '#2d88ff',
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // 2. If no user, send to Signup
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // 3. FIX: Redirect based on role. 
  // In Expo Router, you don't always need the parentheses in the path.
  // We use 'as any' to prevent TypeScript from blocking the build on dynamic paths.
  if (user.role === 'driver') {
    return <Redirect href="/(driver)/home" as any />;
  } else if (user.role === 'dispatcher') {
    return <Redirect href="/(dispatcher)/home" as any />;
  } else {
    return <Redirect href="/(client)/home" as any />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});