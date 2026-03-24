import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { pickAndUploadCSV } from "../../utils/seeder";
import { Ionicons } from "@expo/vector-icons";

export default function DispatcherHome() {
  const router = useRouter();
  
  const [activeOrderCount, setActiveOrderCount] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  
  const userEmail = auth.currentUser?.email;

  const COLORS = {
    bg: "#18191a",
    card: "#242526",
    primary: "#2d88ff",
    text: "#e4e6eb",
    secondary: "#b0b3b8",
    accent: "#42b72a",
    error: "#f35e7a",
    border: "#3a3b3c",
  };

  useEffect(() => {
    const activeQ = query(collection(db, "standing_orders"), where("status", "!=", "completed"));
    const unsubActive = onSnapshot(activeQ, (snap) => setActiveOrderCount(snap.size));

    const completedQ = query(collection(db, "standing_orders"), where("status", "==", "completed"));
    const unsubComp = onSnapshot(completedQ, (snap) => setCompletedCount(snap.size));

    return () => { unsubActive(); unsubComp(); };
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "standing_orders"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentActivities(activities);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Logout Error", error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* --- REFINED HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.adminTag}>SYSTEM DISPATCHER</Text>
          <Text style={styles.emailText}>{userEmail?.split('@')[0] || "Admin"}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- STATS SECTION --- */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.statCard, { borderColor: COLORS.primary }]}
            onPress={() => router.push("/(dispatcher)/view_orders" as any)}
          >
            <Text style={[styles.statNumber, { color: COLORS.primary }]}>{activeOrderCount ?? "0"}</Text>
            <Text style={styles.statLabel}>ACTIVE ORDERS</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.accent }]}>{completedCount ?? "0"}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Operations</Text>
        
        {/* --- ACTION ITEMS --- */}
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.actionItem} 
          onPress={() => router.push("/(dispatcher)/weekly_schedule" as any)}
        >
          <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name="calendar" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Weekly Schedule</Text>
            <Text style={styles.actionSub}>Manage routes by County</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.actionItem} 
          onPress={pickAndUploadCSV}
        >
          <View style={[styles.iconCircle, { backgroundColor: COLORS.error + '20' }]}>
            <Ionicons name="cloud-upload-outline" size={22} color={COLORS.error} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Import Data</Text>
            <Text style={styles.actionSub}>Seed Firestore via CSV</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Recent Activity</Text>
        
        {/* --- ACTIVITY FEED --- */}
        <View style={styles.activityContainer}>
          {recentActivities.length === 0 ? (
            <View style={styles.emptyBox}>
               <Text style={styles.emptyText}>No recent movement detected.</Text>
            </View>
          ) : (
            recentActivities.map((item, index) => (
              <View key={item.id} style={[styles.activityItem, index === 0 && { borderTopWidth: 0 }]}>
                <View style={[styles.statusDot, { 
                  backgroundColor: item.status === 'completed' ? COLORS.accent : 
                                   item.status === 'assigned' ? COLORS.primary : COLORS.secondary 
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityMainText} numberOfLines={1}>
                    {item.patientName || "System Update"} 
                  </Text>
                  <Text style={styles.activitySubText}>{item.pickupCity || item.pickupCounty} • {item.status}</Text>
                </View>
                <Text style={styles.activityTimeText}>Just now</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#18191a",
  },
  adminTag: { color: "#2d88ff", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  emailText: { color: "#ffffff", fontSize: 24, fontWeight: "800", textTransform: 'capitalize' },
  logoutIconBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: "#242526", 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3b3c"
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 30 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, marginTop: 10 },
  statCard: {
    backgroundColor: "#242526", width: "48%", paddingVertical: 20, borderRadius: 20,
    alignItems: "center", borderWidth: 1.5, borderColor: "#3a3b3c",
  },
  statNumber: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  statLabel: { color: "#b0b3b8", fontSize: 10, fontWeight: "800", marginTop: 4, letterSpacing: 0.5 },
  sectionLabel: { color: "#e4e6eb", fontSize: 16, fontWeight: "800", marginBottom: 16, letterSpacing: 0.5 },
  actionItem: {
    backgroundColor: "#242526", borderRadius: 22, padding: 18,
    flexDirection: "row", alignItems: "center", marginBottom: 14,
    borderWidth: 1, borderColor: "#3a3b3c",
  },
  iconCircle: { width: 50, height: 50, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  actionInfo: { flex: 1, marginLeft: 16 },
  actionTitle: { color: "#e4e6eb", fontSize: 17, fontWeight: "700" },
  actionSub: { color: "#b0b3b8", fontSize: 13, marginTop: 2 },
  
  activityContainer: {
    backgroundColor: "#242526", borderRadius: 24, paddingVertical: 8,
    borderWidth: 1, borderColor: "#3a3b3c",
  },
  activityItem: {
    flexDirection: 'row', alignItems: 'center', padding: 18,
    borderTopWidth: 1, borderTopColor: "#3a3b3c",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 16 },
  activityMainText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  activitySubText: { color: "#b0b3b8", fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  activityTimeText: { color: "#8a8d91", fontSize: 10, fontWeight: "600" },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: "#b0b3b8", fontSize: 14, fontWeight: "500" },
});