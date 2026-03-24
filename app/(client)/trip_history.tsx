import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";

export default function TripHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const COLORS = {
    bg: "#18191a",
    card: "#242526",
    primary: "#2d88ff",
    text: "#e4e6eb",
    secondary: "#b0b3b8",
    border: "#3a3b3c",
    success: "#42b72a",
    error: "#f35e7a",
  };

  useEffect(() => {
    if (!user) return;

    // Query for COMPLETED or CANCELLED trips
    const q = query(
      collection(db, "standing_orders"),
      where("clientId", "==", user.uid),
      where("status", "in", ["completed", "cancelled"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pastTrips = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHistory(pastTrips);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderTripItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={() => router.push({ pathname: "/(client)/trip_info", params: { orderId: item.id } })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "Past Trip"}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? COLORS.success + '20' : COLORS.error + '20' }]}>
          <Text style={[styles.statusText, { color: item.status === 'completed' ? COLORS.success : COLORS.error }]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.patientName}>{item.patientName}</Text>
      
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={COLORS.secondary} />
        <Text style={styles.addressText} numberOfLines={1}>
          {item.pickupStreet}, {item.pickupCity}
        </Text>
      </View>

      {item.clientRating && (
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.clientRating} / 5 Rating</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <Stack.Screen 
        options={{ 
          title: "Trip History", 
          headerTintColor: COLORS.text,
          headerStyle: { backgroundColor: COLORS.card },
        }} 
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="archive-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyText}>No past trips found</Text>
          <Text style={styles.emptySub}>Completed trips will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderTripItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  listContent: { padding: 20 },
  historyCard: {
    backgroundColor: "#242526",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#3a3b3c",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateText: { color: "#b0b3b8", fontSize: 12, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "bold" },
  patientName: { color: "#e4e6eb", fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  addressText: { color: "#b0b3b8", fontSize: 13, marginLeft: 6, flex: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  ratingText: { color: "#FFD700", fontSize: 12, marginLeft: 5, fontWeight: "600" },
  emptyText: { color: "#e4e6eb", fontSize: 18, fontWeight: "bold", marginTop: 20 },
  emptySub: { color: "#b0b3b8", fontSize: 14, textAlign: "center", marginTop: 8 },
});