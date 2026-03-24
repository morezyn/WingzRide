import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { auth, db } from "../../config/firebase";
import { StandingOrder } from "../../types";

export default function DriverSchedule() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<StandingOrder[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const COLORS = {
    bg: "#18191a",
    card: "#242526",
    primary: "#2d88ff",
    text: "#e4e6eb",
    secondary: "#b0b3b8",
    border: "#3a3b3c",
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Query for accepted/active trips assigned to this driver
    const q = query(
      collection(db, "standing_orders"),
      where("assignedDriverId", "==", user.uid),
      where("status", "in", ["accepted", "en-route", "arrived"]),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTrips: StandingOrder[] = [];
        const marks: any = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as StandingOrder;

          // Use createdAt string (ISO format) to derive the calendar date
          // Splits "2026-03-13T12:00:00Z" into ["2026-03-13", "12:00:00Z"]
          const dateKey = data.createdAt ? data.createdAt.split("T")[0] : "";

          if (dateKey) {
            fetchedTrips.push({ ...data, orderId: doc.id });

            marks[dateKey] = {
              marked: true,
              dotColor: COLORS.primary,
            };
          }
        });

        setTrips(fetchedTrips);
        setMarkedDates(marks);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Filter the list based on the date selected on the calendar
  const filteredTrips = trips.filter(
    (t) => t.createdAt?.split("T")[0] === selectedDate,
  );

  const renderTripItem = ({ item }: { item: StandingOrder }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() =>
        router.push({
          pathname: "/(driver)/order_details",
          params: { orderId: item.orderId },
        })
      }
    >
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{item.pickupTimeA}</Text>
        <View style={[styles.statusDot, { backgroundColor: COLORS.primary }]} />
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.addressText} numberOfLines={1}>
          {item.pickupStreet}, {item.pickupCity}
        </Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusLabel}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <Stack.Screen
        options={{
          title: "My Schedule",
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: "#fff",
        }}
      />

      <Calendar
        theme={{
          backgroundColor: COLORS.card,
          calendarBackground: COLORS.card,
          textSectionTitleColor: COLORS.secondary,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: "#ffffff",
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          textDisabledColor: COLORS.border,
          dotColor: COLORS.primary,
          monthTextColor: "#fff",
          indicatorColor: COLORS.primary,
          arrowColor: COLORS.primary,
        }}
        markedDates={{
          ...markedDates,
          [selectedDate]: { ...markedDates[selectedDate], selected: true },
        }}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
      />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Trips for {selectedDate}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{filteredTrips.length}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.orderId}
          renderItem={renderTripItem}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={COLORS.border}
              />
              <Text style={styles.emptyText}>
                No accepted trips for this date.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tripCard: {
    backgroundColor: "#242526",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3b3c",
  },
  timeBox: {
    alignItems: "center",
    width: 65,
    borderRightWidth: 1,
    borderRightColor: "#3a3b3c",
    marginRight: 15,
  },
  timeText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  infoBox: { flex: 1 },
  patientName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  addressText: { color: "#b0b3b8", fontSize: 12, marginTop: 4 },
  statusBadge: {
    backgroundColor: "#2d88ff20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusLabel: {
    color: "#2d88ff",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  listHeader: { flexDirection: "row", alignItems: "center", padding: 20 },
  listTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", flex: 1 },
  badge: {
    backgroundColor: "#3a3b3c",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  emptyState: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#b0b3b8", marginTop: 12, fontSize: 14 },
});
