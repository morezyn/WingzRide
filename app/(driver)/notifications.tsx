import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  StatusBar, ActivityIndicator, Modal, Animated, Dimensions, Pressable, Alert 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../config/firebase';
import { 
  collection, query, where, onSnapshot, 
  orderBy, doc, writeBatch, serverTimestamp 
} from 'firebase/firestore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AppNotification {
  id: string;
  orderId: string;
  tripId: string;
  title: string;
  message: string;
  type: 'assignment' | 'alert';
  userId: string;
  createdAt: any;
}

export default function NotificationCenter() {
  const router = useRouter();
  const user = auth.currentUser;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
    if (!user) return;
    
    // Listening for notifications specific to this driver
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as AppNotification[];
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error("Notification listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleModal = (notif: AppNotification | null) => {
    if (notif) {
      setSelectedNotif(notif);
      Animated.spring(slideAnim, { 
        toValue: 0, 
        tension: 50, 
        friction: 8, 
        useNativeDriver: true 
      }).start();
    } else {
      Animated.timing(slideAnim, { 
        toValue: SCREEN_HEIGHT, 
        duration: 250, 
        useNativeDriver: true 
      }).start(() => setSelectedNotif(null));
    }
  };

  const handleResponse = async (status: 'accepted' | 'rejected') => {
    if (!selectedNotif) return;
    
    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, "standing_orders", selectedNotif.orderId);
      const notifRef = doc(db, "notifications", selectedNotif.id);
      
      if (status === 'accepted') {
        // Update the order so Home.tsx picks it up immediately
        batch.update(orderRef, {
          status: 'accepted',
          driverAcknowledgeAt: serverTimestamp()
        });
      } else {
        // If rejected, move status back to unassigned or pending for dispatcher
        batch.update(orderRef, {
          status: 'pending', 
          assignedDriverId: null 
        });
      }

      // Remove the notification from the list after action
      batch.delete(notifRef);
      
      await batch.commit();

      toggleModal(null);
      
      if (status === 'accepted') {
        // Redirect home where the 'accepted' trip will be displayed
        router.replace('/(driver)/home');
      }
    } catch (error) {
      console.error("Error handling notification response:", error);
      Alert.alert("Action Failed", "Could not update the trip. Please try again.");
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity style={styles.notifCard} onPress={() => toggleModal(item)}>
      <View style={[styles.iconCircle, { backgroundColor: item.type === 'assignment' ? COLORS.primary + '20' : COLORS.border }]}>
        <Ionicons 
          name={item.type === 'assignment' ? 'car-sport' : 'notifications'} 
          size={22} 
          color={item.type === 'assignment' ? COLORS.primary : COLORS.text} 
        />
      </View>
      <View style={styles.textDetails}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Action Center', 
        headerStyle: { backgroundColor: COLORS.card }, 
        headerTintColor: COLORS.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )
      }} />
      <StatusBar barStyle="light-content" />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="mail-open-outline" size={60} color={COLORS.border} />
              <Text style={styles.emptyText}>No pending actions</Text>
            </View>
          }
        />
      )}

      {/* Animated Bottom Sheet */}
      <Modal visible={!!selectedNotif} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => toggleModal(null)} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{selectedNotif?.title}</Text>
            <Text style={styles.sheetMsg}>{selectedNotif?.message}</Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.rejectBtn]} 
                onPress={() => handleResponse('rejected')}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                <Text style={[styles.btnText, { color: COLORS.danger }]}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, styles.acceptBtn]} 
                onPress={() => handleResponse('accepted')}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>Accept Trip</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  notifCard: { 
    backgroundColor: '#242526', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#3a3b3c' 
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textDetails: { flex: 1 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  body: { color: '#b0b3b8', fontSize: 14, marginTop: 2 },
  time: { color: '#2d88ff', fontSize: 11, marginTop: 8, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#b0b3b8', fontSize: 16, marginTop: 10 },
  
  // Sheet Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { 
    backgroundColor: '#242526', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 24, 
    paddingBottom: 50, 
    borderTopWidth: 1, 
    borderTopColor: '#3a3b3c' 
  },
  handle: { width: 40, height: 4, backgroundColor: '#3a3b3c', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  sheetMsg: { color: '#b0b3b8', fontSize: 16, textAlign: 'center', marginVertical: 20, lineHeight: 24 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { flex: 1, height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  rejectBtn: { backgroundColor: 'rgba(243, 94, 122, 0.1)', borderWidth: 1, borderColor: '#f35e7a' },
  acceptBtn: { backgroundColor: '#2d88ff' },
  btnText: { fontSize: 17, fontWeight: 'bold' }
});