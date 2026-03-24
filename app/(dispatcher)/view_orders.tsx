import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, ScrollView, Modal, Alert, 
  Pressable, Animated, Dimensions 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Stack, useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, 
  where, getDocs, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { StandingOrder } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  bg: '#18191a',
  card: '#242526',
  primary: '#2d88ff',
  text: '#e4e6eb',
  secondary: '#b0b3b8',
  accent: '#42b72a', 
  warning: '#f3bc6a', 
  border: '#3a3b3c',
  danger: '#f35e7a'
};

export default function ViewOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<StandingOrder[]>([]);
  const [drivers, setDrivers] = useState<{id: string, name: string, pushToken?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPlace, setSelectedPlace] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned'>('all');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<StandingOrder | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
    }
  }, [modalVisible]);

  // FIXED: Real-time listener ensures orderId is the Firestore Doc ID
  useEffect(() => {
    const q = query(collection(db, "standing_orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            orderId: doc.id, // This MUST be doc.id to allow updates
          };
        }) as StandingOrder[];
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Listener Error:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "driver"));
        const querySnapshot = await getDocs(q);
        setDrivers(querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().displayName || doc.data().email,
          pushToken: doc.data().pushToken
        })));
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };
    fetchDrivers();
  }, []);

  const places = useMemo(() => {
    const uniquePlaces = Array.from(new Set(
      orders.map(o => o.pickupCounty || o.pickupCity || 'Unknown')
    ));
    return ['All', ...uniquePlaces.sort()];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderPlace = order.pickupCounty || order.pickupCity || 'Unknown';
      const orderStatus = order.status || 'pending';
      const placeMatch = selectedPlace === 'All' || orderPlace === selectedPlace;
      const statusMatch = statusFilter === 'all' || orderStatus === statusFilter;
      return placeMatch && statusMatch;
    });
  }, [orders, selectedPlace, statusFilter]);

  const stats = useMemo(() => ({
    pending: orders.filter(o => (o.status === 'pending' || !o.status)).length,
    assigned: orders.filter(o => o.status === 'assigned').length
  }), [orders]);

  const handleAssignDriver = async (driverId: string, driverName: string) => {
    if (!orderToAssign?.orderId) {
      Alert.alert("Error", "Missing Reference ID");
      return;
    }

    try {
      const batch = writeBatch(db);
      // This ref now correctly uses the doc.id (e.g. "zXy123") instead of "88200"
      const orderRef = doc(db, "standing_orders", orderToAssign.orderId);
      
      batch.update(orderRef, {
        assignedDriverId: driverId,
        assignedDriverName: driverName,
        status: 'assigned',
      });

      const notifRef = doc(collection(db, "notifications"));
      batch.set(notifRef, {
        userId: driverId,
        orderId: orderToAssign.orderId,
        tripId: orderToAssign.tripId || 'N/A',
        title: "New Trip Assigned",
        message: `Trip for ${orderToAssign.patientName} has been assigned to you.`,
        type: "assignment",
        createdAt: serverTimestamp(),
        read: false
      });

      await batch.commit();
      setModalVisible(false);
      Alert.alert("Success", `Assigned to ${driverName}`);
    } catch (error: any) {
      console.error("Assignment Batch Error:", error);
      Alert.alert("Assignment Failed", "Document not found or permission denied.");
    }
  };

  const renderOrderItem = ({ item }: { item: StandingOrder }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      style={[styles.card, item.status === 'assigned' && { borderColor: COLORS.accent + '40' }]} 
      onPress={() => {
        setOrderToAssign(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.tripId}>{item.tripId || 'ID Pending'}</Text>
          <Text style={styles.clientText}>{item.clientOrg} • {item.pickupCounty || item.pickupCity}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.status === 'assigned' ? COLORS.accent + '20' : COLORS.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: item.status === 'assigned' ? COLORS.accent : COLORS.primary }]}>
            {item.status?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
      </View>

      <Text style={styles.patientName}>{item.patientName}</Text>
      
      {item.assignedDriverName && (
        <View style={styles.driverContainer}>
          <Ionicons name="car" size={14} color={COLORS.accent} />
          <Text style={styles.driverText}> Assigned: {item.assignedDriverName}</Text>
        </View>
      )}

      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.addressText} numberOfLines={1}>{item.pickupStreet}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
          <Text style={styles.addressText} numberOfLines={1}>{item.dropoffStreet}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <Text style={styles.footerLabel}>SCHEDULE: <Text style={styles.timeValue}>{item.scheduleDays?.join(', ') || 'One-time'}</Text></Text>
         <Text style={styles.timeValue}>{item.pickupTimeA}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.topRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Dispatch Hub</Text>
                <Text style={styles.headerSub}>{filteredOrders.length} Trips in view</Text>
            </View>
        </View>

        <View style={styles.segmentContainer}>
            {(['all', 'pending', 'assigned'] as const).map((s) => (
                <TouchableOpacity 
                    key={s}
                    style={[styles.segment, statusFilter === s && styles.segmentActive]} 
                    onPress={() => setStatusFilter(s)}
                >
                    <Text style={[styles.segmentText, statusFilter === s && styles.segmentTextActive]}>
                        {s.toUpperCase()} {s !== 'all' ? `(${stats[s]})` : ''}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
            <View style={styles.filterIconBox}>
                <Ionicons name="location-outline" size={14} color={COLORS.secondary} />
            </View>
            {places.map(place => (
                <TouchableOpacity 
                    key={place}
                    style={[styles.filterChip, selectedPlace === place && styles.filterChipActive]}
                    onPress={() => setSelectedPlace(place)}
                >
                    <Text style={[styles.filterChipText, selectedPlace === place && styles.filterChipTextActive]}>{place}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
                <Ionicons name="map-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No trips found matching criteria.</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
              <Pressable> 
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Assign Driver</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color={COLORS.secondary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalSub}>{orderToAssign?.patientName} • {orderToAssign?.tripId}</Text>

                <ScrollView style={styles.driverList} showsVerticalScrollIndicator={false}>
                  {drivers.map(driver => (
                    <TouchableOpacity 
                      key={driver.id} 
                      style={styles.driverItem}
                      onPress={() => handleAssignDriver(driver.id, driver.name)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <View style={styles.driverAvatar}>
                            <Text style={styles.avatarText}>{driver.name.charAt(0)}</Text>
                         </View>
                         <Text style={styles.driverItemText}>{driver.name}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, backgroundColor: '#242526', borderBottomWidth: 1, borderBottomColor: '#3a3b3c' },
  topRow: { paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { padding: 8, marginRight: 10, borderRadius: 10, backgroundColor: '#3a3b3c' },
  headerTitleContainer: { flex: 1 },
  headerTitle: { color: '#e4e6eb', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#b0b3b8', fontSize: 12 },
  segmentContainer: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 15, gap: 10 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#18191a', borderWidth: 1, borderColor: '#3a3b3c' },
  segmentActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  segmentText: { color: COLORS.secondary, fontSize: 10, fontWeight: 'bold' },
  segmentTextActive: { color: '#fff' },
  filterContainer: { paddingHorizontal: 15, paddingBottom: 15, alignItems: 'center' },
  filterIconBox: { marginRight: 10, padding: 5 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, backgroundColor: '#3a3b3c', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  filterChipActive: { borderColor: COLORS.primary, backgroundColor: '#2d88ff20' },
  filterChipText: { color: '#b0b3b8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.primary },
  listContent: { padding: 15 },
  card: { backgroundColor: '#242526', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#3a3b3c' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tripId: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  clientText: { color: '#b0b3b8', fontSize: 11 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  patientName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  driverContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  driverText: { color: COLORS.accent, fontSize: 12, fontWeight: 'bold' },
  routeContainer: { marginVertical: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 12 },
  routeLine: { width: 1, height: 10, backgroundColor: '#3a3b3c', marginLeft: 2.5, marginVertical: 2 },
  addressText: { color: '#e4e6eb', fontSize: 13, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#3a3b3c' },
  footerLabel: { color: '#b0b3b8', fontSize: 11 },
  timeValue: { color: '#e4e6eb', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#242526', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: 450 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  modalSub: { color: '#b0b3b8', marginVertical: 10, fontSize: 14 },
  driverList: { marginTop: 15 },
  driverItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#18191a', borderRadius: 16, marginBottom: 10 },
  driverAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  driverItemText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#b0b3b8', marginTop: 15, fontSize: 15 }
});