import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ScrollView, StatusBar, ActivityIndicator 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { StandingOrder } from '../../types';

const DAYS = [
  { short: 'Mon', code: 'M' },
  { short: 'Tue', code: 'T' },
  { short: 'Wed', code: 'W' },
  { short: 'Thu', code: 'TH' },
  { short: 'Fri', code: 'F' },
  { short: 'Sat', code: 'S' },
  { short: 'Sun', code: 'SU' },
];

export default function WeeklySchedule() {
  const router = useRouter();
  const [orders, setOrders] = useState<StandingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);

  const COLORS = {
    bg: '#18191a',
    card: '#242526',
    primary: '#2d88ff',
    text: '#e4e6eb',
    secondary: '#b0b3b8',
    border: '#3a3b3c',
    accent: '#42b72a',
    danger: '#f35e7a'
  };

  useEffect(() => {
    const q = query(collection(db, "standing_orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data() as StandingOrder;
        return {
          ...data,
          // Ensuring orderId is always the Firestore Document ID
          orderId: data.orderId || doc.id 
        };
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const dailyOrders = useMemo(() => {
    return orders
      .filter(order => order.scheduleDays?.includes(selectedDay.code))
      .sort((a, b) => (a.pickupTimeA ?? "").localeCompare(b.pickupTimeA ?? ""));
  }, [orders, selectedDay]);

  const renderScheduleItem = ({ item }: { item: StandingOrder }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.timeSection}>
        <Text style={styles.timeText}>{item.pickupTimeA}</Text>
        <View style={styles.verticalLine} />
        <Text style={[styles.timeText, { color: COLORS.secondary }]}>{item.pickupTimeB}</Text>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.routeText} numberOfLines={1}>
          <Ionicons name="location" size={12} color={COLORS.primary} /> {item.pickupStreet}
        </Text>
        
        {item.assignedDriverName ? (
          <View style={styles.driverTag}>
            <Ionicons name="car" size={12} color={COLORS.accent} />
            <Text style={styles.driverNameText}> {item.assignedDriverName}</Text>
          </View>
        ) : (
          <Text style={[styles.routeText, { color: COLORS.danger }]}>
            <Ionicons name="warning" size={12} color={COLORS.danger} /> Unassigned
          </Text>
        )}
      </View>

      <View style={styles.typeSection}>
        <Text style={styles.typeText}>{item.mobilityType}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Weekly Schedule</Text>
          <Text style={styles.headerSub}>
            {loading ? 'Syncing...' : `${dailyOrders.length} Trips found`}
          </Text>
        </View>
      </View>

      <View style={styles.selectorWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
          {DAYS.map((day) => (
            <TouchableOpacity 
              key={day.code} 
              style={[styles.dayChip, selectedDay.code === day.code && styles.activeChip]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayText, selectedDay.code === day.code && styles.activeDayText]}>
                {day.short}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={dailyOrders}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.orderId} // Fixed: Uses orderId instead of id
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>No recurring trips for {selectedDay.short}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#242526', flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { color: '#e4e6eb', fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: '#b0b3b8', fontSize: 13 },
  selectorWrapper: { backgroundColor: '#242526', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#3a3b3c' },
  dayScroll: { paddingHorizontal: 15 },
  dayChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#3a3b3c' },
  activeChip: { backgroundColor: '#2d88ff' },
  dayText: { color: '#b0b3b8', fontWeight: '600', fontSize: 14 },
  activeDayText: { color: '#fff' },
  listContent: { padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scheduleCard: { 
    backgroundColor: '#242526', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 12, 
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3b3c'
  },
  timeSection: { width: 75, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#3a3b3c', paddingRight: 10 },
  timeText: { color: '#e4e6eb', fontSize: 13, fontWeight: 'bold' },
  verticalLine: { height: 8, width: 1, backgroundColor: '#3a3b3c', marginVertical: 4 },
  detailsSection: { flex: 1, paddingHorizontal: 15 },
  patientName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  routeText: { color: '#b0b3b8', fontSize: 12, marginTop: 2 },
  driverTag: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#18191a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  driverNameText: { color: '#42b72a', fontSize: 11, fontWeight: '600' },
  typeSection: { alignItems: 'flex-end' },
  typeText: { color: '#2d88ff', fontSize: 10, fontWeight: 'bold', opacity: 0.8 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#b0b3b8', marginTop: 15, fontSize: 16 }
});