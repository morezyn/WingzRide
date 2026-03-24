import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#242526' },
        headerTintColor: '#fff',
      }}
    >
      {/* HIDE THE DASHBOARD HEADER */}
      <Stack.Screen 
        name="home" 
        options={{ 
          headerShown: false 
        }} 
      />

      {/* NEW TRIP MODAL */}
      <Stack.Screen 
        name="new_trip" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerTitle: 'New Trip',
          headerShown: true 
        }} 
      />
      
      {/* FIXED: Changed "new_task" to "trip_info" to match your file name */}
      <Stack.Screen 
        name="trip_info" 
        options={{ 
          presentation: 'card', // Standard push animation for tracking
          headerTitle: 'Trip Progress',
          headerShown: true 
        }} 
      />

      {/* KEEP HEADERS FOR OTHER SCREENS */}
      <Stack.Screen name="trip_history" options={{ headerTitle: 'My Trips' }} />
      <Stack.Screen name="receipts" options={{ headerTitle: 'Receipts' }} />
    </Stack>
  );
}