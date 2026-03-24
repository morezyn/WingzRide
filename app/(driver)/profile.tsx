import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Alert, Image, Switch 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DriverProfile() {
  const router = useRouter();
  const user = auth.currentUser;
  const [userData, setUserData] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  const COLORS = {
    bg: '#18191a',
    card: '#242526',
    primary: '#2d88ff',
    text: '#e4e6eb',
    secondary: '#b0b3b8',
    border: '#3a3b3c',
    danger: '#f35e7a',
    success: '#42b72a'
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await signOut(auth);
          router.replace('/signup');
        } 
      }
    ]);
  };

  const InfoRow = ({ icon, label, value, color = COLORS.text }: any) => (
    <View style={styles.infoRow}>
      <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not Set'}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <Stack.Screen options={{ 
        title: 'Profile', 
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.card },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=${user?.displayName || 'Driver'}&background=2d88ff&color=fff&size=128` }} 
              style={styles.avatar} 
            />
            <View style={[styles.onlineStatus, { backgroundColor: isAvailable ? COLORS.success : COLORS.secondary }]} />
          </View>
          <Text style={styles.userName}>{user?.displayName || 'Driver Name'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Status Toggle */}
        <View style={styles.section}>
          <View style={styles.statusCard}>
            <View>
              <Text style={styles.statusTitle}>Duty Status</Text>
              <Text style={styles.statusSub}>{isAvailable ? 'Available for new trips' : 'Off-duty'}</Text>
            </View>
            <Switch 
              value={isAvailable} 
              onValueChange={setIsAvailable}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={isAvailable ? COLORS.primary : COLORS.secondary}
            />
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Information</Text>
          <View style={styles.card}>
            <InfoRow icon="person" label="Full Name" value={user?.displayName} color={COLORS.primary} />
            <View style={styles.divider} />
            <InfoRow icon="mail" label="Email Address" value={user?.email} color={COLORS.primary} />
            <View style={styles.divider} />
            <InfoRow icon="call" label="Phone" value={userData?.phone} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.card}>
            <InfoRow icon="car" label="Vehicle Model" value={userData?.vehicleModel || 'Silver Transit Van'} color={COLORS.success} />
            <View style={styles.divider} />
            <InfoRow icon="barcode" label="License Plate" value={userData?.plateNumber || 'ABC-1234'} color={COLORS.success} />
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#242526' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#3a3b3c' },
  onlineStatus: { position: 'absolute', bottom: 5, right: 5, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#242526' },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  userEmail: { color: '#b0b3b8', fontSize: 14, marginTop: 4 },
  section: { marginTop: 25, paddingHorizontal: 20 },
  sectionTitle: { color: '#b0b3b8', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 10, marginLeft: 5, textTransform: 'uppercase' },
  card: { backgroundColor: '#242526', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#3a3b3c' },
  statusCard: { 
    backgroundColor: '#242526', 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3b3c'
  },
  statusTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusSub: { color: '#b0b3b8', fontSize: 13, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoText: { marginLeft: 15 },
  infoLabel: { color: '#b0b3b8', fontSize: 11, fontWeight: 'bold' },
  infoValue: { color: '#fff', fontSize: 15, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#3a3b3c', marginLeft: 55, marginVertical: 5 },
  editBtn: { 
    margin: 20, 
    height: 55, 
    borderRadius: 16, 
    backgroundColor: '#3a3b3c', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});