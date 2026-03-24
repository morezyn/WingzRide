import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { auth, db } from "../../config/firebase";

export default function Receipts() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const COLORS = {
    bg: "#18191a",
    card: "#242526",
    primary: "#2d88ff",
    text: "#e4e6eb",
    secondary: "#b0b3b8",
    border: "#3a3b3c",
    accent: "#42b72a",
  };

  useEffect(() => {
    if (!user) return;

    // Fetching completed orders to generate "receipts"
    const q = query(
      collection(db, "standing_orders"),
      where("clientId", "==", user.uid),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReceipts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDownload = (id: string) => {
    Alert.alert("Generating Receipt", "Your receipt is being generated and will be saved to your downloads.");
    // Here you would typically integrate with an API to generate a PDF or open a URL
  };

  const renderReceipt = ({ item }: { item: any }) => (
    <View style={styles.receiptCard}>
      <View style={styles.receiptIcon}>
        <Ionicons name="document-text" size={24} color={COLORS.primary} />
      </View>
      
      <View style={styles.receiptInfo}>
        <Text style={styles.receiptId}>INV-#{item.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.dateText}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "Date Pending"}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.downloadBtn} 
        onPress={() => handleDownload(item.id)}
      >
        <Ionicons name="download-outline" size={20} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <Stack.Screen 
        options={{ 
          title: "Billing & Receipts",
          headerTintColor: COLORS.text,
          headerStyle: { backgroundColor: COLORS.card },
        }} 
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Trips This Month</Text>
        <Text style={styles.summaryValue}>{receipts.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : receipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyText}>No receipts available</Text>
          <Text style={styles.emptySub}>Receipts are generated automatically after a trip is completed.</Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => item.id}
          renderItem={renderReceipt}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryCard: {
    backgroundColor: "#2d88ff",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  summaryLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" },
  summaryValue: { color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 5 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  receiptCard: {
    backgroundColor: "#242526",
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3a3b3c",
  },
  receiptIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "rgba(45, 136, 255, 0.1)",
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptInfo: { flex: 1, marginLeft: 15 },
  receiptId: { color: "#2d88ff", fontSize: 12, fontWeight: "bold", marginBottom: 2 },
  patientName: { color: "#e4e6eb", fontSize: 15, fontWeight: "600" },
  dateText: { color: "#b0b3b8", fontSize: 12, marginTop: 2 },
  downloadBtn: {
    padding: 10,
    backgroundColor: "#3a3b3c",
    borderRadius: 10,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: "#e4e6eb", fontSize: 18, fontWeight: "bold", marginTop: 20 },
  emptySub: { color: "#b0b3b8", fontSize: 14, textAlign: 'center', marginTop: 8 },
});