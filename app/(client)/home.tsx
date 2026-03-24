import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ClientHome() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const COLORS = {
    bg: "#18191a",
    card: "#242526",
    primary: "#2d88ff",
    text: "#e4e6eb",
    secondary: "#b0b3b8",
    divider: "#3a3b3c",
    success: "#42b72a",
    warning: "#f7b928",
    danger: "#f35e7a", // Added for logout button
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    if (!user) return;

    const q = query(
      collection(db, "standing_orders"),
      where("clientId", "==", user.uid),
      where("status", "!=", "completed"),
      orderBy("status"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(taskList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/signup");
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* HEADER SECTION */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.emailText}>
            {user?.displayName || user?.email?.split("@")[0]}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* MAIN ACTION: NEW TRIP */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionCard, { borderColor: COLORS.primary, borderWidth: 1.5 }]}
          onPress={() => router.push("/(client)/new_trip")}
        >
          <View style={[styles.iconCircle, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="add" size={30} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.cardTitle}>New Trip Request</Text>
            <Text style={styles.cardSub}>Schedule a new transport</Text>
          </View>
        </TouchableOpacity>

        {/* SECONDARY ACTIONS ROW */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.smallCard}
            onPress={() => router.push("/(client)/trip_history" as any)}
          >
            <View style={[styles.smallIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="time-outline" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.smallCardText}>Trip History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.smallCard}
            onPress={() => router.push("/(client)/receipts" as any)}
          >
            <View style={[styles.smallIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.smallCardText}>Receipts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Active Requests</Text>
          {tasks.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{tasks.length}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={40} color={COLORS.divider} />
            <Text style={styles.emptyText}>No active trips</Text>
            <Text style={styles.emptySub}>Your ongoing trips will show here.</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              activeOpacity={0.7}
              style={styles.taskCard}
              onPress={() => router.push({ pathname: "/(client)/trip_info", params: { orderId: task.id } })}
            >
              <View style={styles.taskInfo}>
                <Text style={styles.patientName}>{task.patientName}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={12} color={COLORS.primary} />
                  <Text style={styles.addressText} numberOfLines={1}>{task.pickupStreet}</Text>
                </View>
              </View>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: COLORS.primary }]}>
                  {task.status?.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#18191a", // Deep background color
  },
  welcomeText: { color: "#b0b3b8", fontSize: 13, fontWeight: "600", textTransform: 'uppercase' },
  emailText: { color: "#ffffff", fontSize: 22, fontWeight: "800" },
  
  // New Text-Based Logout Button
  logoutBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: "rgba(243, 94, 122, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(243, 94, 122, 0.2)"
  },
  logoutText: { color: "#f35e7a", fontSize: 13, fontWeight: "700" },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
  actionCard: {
    backgroundColor: "#242526", borderRadius: 22, padding: 20,
    flexDirection: "row", alignItems: "center", marginBottom: 20,
  },
  iconCircle: { width: 50, height: 50, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  cardTitle: { color: "#e4e6eb", fontSize: 17, fontWeight: "800" },
  cardSub: { color: "#b0b3b8", fontSize: 13, marginTop: 2 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  smallCard: {
    backgroundColor: "#242526", width: "48%", paddingVertical: 18,
    borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: "#3a3b3c"
  },
  smallIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  smallCardText: { color: "#e4e6eb", fontSize: 14, fontWeight: "700" },

  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  sectionLabel: { color: "#e4e6eb", fontSize: 18, fontWeight: "800" },
  badge: { backgroundColor: "#2d88ff", paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginLeft: 10 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  
  taskCard: {
    backgroundColor: "#242526", padding: 20, borderRadius: 22,
    marginBottom: 14, flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", borderWidth: 1, borderColor: "#3a3b3c",
  },
  taskInfo: { flex: 1 },
  patientName: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  addressText: { color: "#b0b3b8", fontSize: 13, marginLeft: 6 },
  statusBadge: { backgroundColor: "#2d88ff20", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "800" },
  emptyCard: { paddingVertical: 60, alignItems: "center" },
  emptyText: { color: "#e4e6eb", fontSize: 16, fontWeight: "700", marginTop: 15 },
  emptySub: { color: "#b0b3b8", fontSize: 14, textAlign: "center", marginTop: 6 },
});