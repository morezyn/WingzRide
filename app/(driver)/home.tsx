import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  StatusBar, Alert, ActivityIndicator 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../config/firebase'; 
import { signOut } from 'firebase/auth';
import { 
  collection, query, where, onSnapshot, 
  doc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { StandingOrder, TripStatus } from '../../types';

export default function DriverHome() {
  const router = useRouter();
  const [activeTrip, setActiveTrip] = useState<StandingOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  const COLORS = {
    bg: '#18191a',
    card: '#242526',
    primary: '#2d88ff',
    accent: '#42b72a',
    warning: '#f7b928',
    text: '#ffffff',
    secondary: '#b0b3b8',
    border: '#3a3b3c',
    danger: '#f35e7a'
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/signup'); 
    } catch (error) {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "standing_orders"), 
      where("assignedDriverId", "==", user.uid),
      where("status", "in", ["assigned", "accepted", "en-route", "arrived"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data() as StandingOrder;
        setActiveTrip({ ...data, orderId: docSnap.id });
      } else {
        setActiveTrip(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Home Listener Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateTripStatus = async (newStatus: TripStatus) => {
    if (!activeTrip) return;
    try {
      const orderRef = doc(db, "standing_orders", activeTrip.orderId);
      await updateDoc(orderRef, { 
        status: newStatus,
        lastUpdated: serverTimestamp() 
      });
    } catch (error) {
      console.error("Update Error:", error);
      Alert.alert("Error", "Could not update trip.");
    }
  };

  const getActionButton = () => {
    if (!activeTrip) return null;

    // Define the UI mapping for each status to fix the TS error
    const statusConfig: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
      'assigned': { label: 'ACCEPT TRIP', color: COLORS.accent, icon: 'checkmark-circle' },
      'accepted': { label: 'START TRIP', color: COLORS.primary, icon: 'play' },
      'en-route': { label: 'MARK ARRIVED', color: COLORS.warning, icon: 'location' },
      'arrived': { label: 'COMPLETE TRIP', color: COLORS.danger, icon: 'flag' },
    };

    const currentStatus = activeTrip.status;
    const config = statusConfig[currentStatus] || { label: 'UPDATE', color: COLORS.primary, icon: 'refresh' };

    // Define the next logical step in the trip flow
    const nextStatusMap: Record<string, TripStatus> = {
      'assigned': 'accepted',
      'accepted': 'en-route',
      'en-route': 'arrived',
      'arrived': 'completed',
    };

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[styles.actionButton, { backgroundColor: config.color }]} 
        onPress={() => {
          const nextStatus = nextStatusMap[currentStatus];
          if (nextStatus) updateTripStatus(nextStatus);
        }}
      >
        <Text style={[styles.actionText, currentStatus === 'en-route' && { color: '#18191a' }]}>
          {config.label}
        </Text>
        <Ionicons 
          name={config.icon} 
          size={22} 
          color={currentStatus === 'en-route' ? '#18191a' : '#fff'} 
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>WELCOME BACK,</Text>
          <Text style={styles.driverName}>{user?.displayName || 'Active Driver'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(driver)/notifications')}>
            <Ionicons name="notifications" size={22} color={COLORS.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.logoutBtn]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTrip ? (
          <TouchableOpacity 
            activeOpacity={0.9}
            style={styles.activeCard}
            onPress={() => router.push({
              pathname: "/(driver)/order_details",
              params: { orderId: activeTrip.orderId }
            })}
          >
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadgeContainer, { backgroundColor: COLORS.primary + '15' }]}>
                <View style={[styles.statusPulse, { backgroundColor: COLORS.primary }]} />
                <Text style={[styles.statusBadge, { color: COLORS.primary }]}>
                  {activeTrip.status.replace('-', ' ').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.tripId}>#{activeTrip.tripId?.slice(-6).toUpperCase() || 'TRIP'}</Text>
            </View>

            <Text style={styles.patientName}>{activeTrip.patientName}</Text>
            
            <View style={styles.addressSection}>
              <View style={styles.addressRow}>
                <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.addressText} numberOfLines={1}>{activeTrip.pickupStreet}</Text>
              </View>
              <View style={styles.verticalLine} />
              <View style={styles.addressRow}>
                <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.addressText} numberOfLines={1}>{activeTrip.dropoffStreet}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>MOBILITY</Text>
                <Text style={styles.infoVal}>{activeTrip.mobilityType}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>PICKUP TIME</Text>
                <Text style={styles.infoVal}>{activeTrip.pickupTimeA}</Text>
              </View>
            </View>

            {getActionButton()}
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="car-outline" size={60} color={COLORS.border} />
            </View>
            <Text style={styles.emptyText}>Waiting for assignments</Text>
            <Text style={styles.emptySub}>New trip requests from the dispatcher will appear here automatically.</Text>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.refreshBtn} 
              onPress={() => router.push('/(driver)/notifications')}
            >
              <Text style={styles.refreshText}>View Action Center</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 25, 
    backgroundColor: '#18191a', flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center',
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  greet: { color: '#b0b3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  driverName: { color: '#fff', fontSize: 24, fontWeight: '800' },
  iconBtn: { 
    backgroundColor: '#242526', width: 48, height: 48, borderRadius: 16, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3a3b3c' 
  },
  logoutBtn: { backgroundColor: 'rgba(243, 94, 122, 0.1)' },
  scroll: { paddingHorizontal: 24, paddingTop: 10 },
  activeCard: { 
    backgroundColor: '#242526', borderRadius: 28, padding: 24, 
    borderWidth: 1, borderColor: '#3a3b3c', elevation: 10,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusBadgeContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusPulse: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusBadge: { fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  tripId: { color: '#6e6e73', fontSize: 12, fontWeight: '700' },
  patientName: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 25 },
  addressSection: { marginBottom: 30, paddingLeft: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  addressText: { color: '#e4e6eb', marginLeft: 16, fontSize: 16, flex: 1, fontWeight: '600' },
  verticalLine: { width: 2, height: 24, backgroundColor: '#3a3b3c', marginLeft: 3, marginVertical: 4 },
  infoGrid: { 
    flexDirection: 'row', backgroundColor: '#1c1d1e', borderRadius: 20, 
    padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#2a2b2c'
  },
  infoItem: { flex: 1, alignItems: 'center' },
  verticalDivider: { width: 1, height: '100%', backgroundColor: '#3a3b3c' },
  infoLabel: { color: '#6e6e73', fontSize: 10, fontWeight: '800', marginBottom: 4 },
  infoVal: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionButton: { 
    height: 68, borderRadius: 20, flexDirection: 'row', 
    justifyContent: 'center', alignItems: 'center', gap: 12 
  },
  actionText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  emptyCard: { marginTop: 60, alignItems: 'center', paddingHorizontal: 20 },
  emptyIconCircle: { 
    width: 130, height: 130, borderRadius: 65, backgroundColor: '#242526', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#3a3b3c'
  },
  emptyText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  emptySub: { color: '#b0b3b8', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  refreshBtn: { 
    marginTop: 35, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 16, paddingHorizontal: 28, borderRadius: 18, backgroundColor: '#2d88ff' 
  },
  refreshText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});