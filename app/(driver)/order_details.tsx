import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert 
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { StandingOrder, GeoPoint } from '../../types';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';

export default function OrderDetails() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const [order, setOrder] = useState<StandingOrder | null>(null);
  const [routeCoords, setRouteCoords] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('pending');

  const COLORS = {
    bg: '#18191a',
    card: '#242526',
    primary: '#2d88ff',
    success: '#42b72a',
    danger: '#f35e7a',
    text: '#e4e6eb',
  };

  const fetchRoadRoute = async (start: GeoPoint, end: GeoPoint) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=polyline`;
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.code === 'Ok' && json.routes?.length > 0) {
        const decoded = polyline.decode(json.routes[0].geometry);
        const roadPoints: GeoPoint[] = decoded.map((p: number[]) => ({ 
          latitude: p[0], 
          longitude: p[1] 
        }));

        const finalPath = [start, ...roadPoints, end];
        setRouteCoords(finalPath);

        mapRef.current?.fitToCoordinates(finalPath, {
          edgePadding: { top: 100, right: 100, bottom: 400, left: 100 },
          animated: true
        });
      } else {
        // Fallback to straight line if API fails
        setRouteCoords([start, end]);
      }
    } catch (e) {
      console.error("Routing error:", e);
      setRouteCoords([start, end]);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (!orderId) return;
      try {
        const snap = await getDoc(doc(db, "standing_orders", orderId as string));
        if (!snap.exists()) {
          Alert.alert("Error", "Order not found");
          return;
        }

        let data = snap.data() as StandingOrder;
        
        // --- THE FIX: FORCED GEOCODING CHECK ---
        // If your Firebase doesn't have Lat/Lng, we MUST find them here
        if (!data.pickupLocation && data.pickupStreet) {
          const res = await Location.geocodeAsync(`${data.pickupStreet}, ${data.pickupCity || ''}`);
          if (res.length > 0) {
            data.pickupLocation = { latitude: res[0].latitude, longitude: res[0].longitude };
          }
        }

        if (!data.dropoffLocation && data.dropoffStreet) {
          const res = await Location.geocodeAsync(`${data.dropoffStreet}, ${data.dropoffCity || ''}`);
          if (res.length > 0) {
            data.dropoffLocation = { latitude: res[0].latitude, longitude: res[0].longitude };
          }
        }

        setOrder(data);
        setStatus(data.status || 'pending');

        if (data.pickupLocation && data.dropoffLocation) {
          fetchRoadRoute(data.pickupLocation, data.dropoffLocation);
        } else {
          Alert.alert("Map Error", "Could not resolve coordinates for this address.");
        }

      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!orderId) return;
    const nextStatus = status === 'pending' ? 'en-route' : 'completed';
    try {
      await updateDoc(doc(db, "standing_orders", orderId as string), { status: nextStatus });
      setStatus(nextStatus);
      if (nextStatus === 'completed') router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Trip Details", headerTintColor: '#fff' }} />

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: order?.pickupLocation?.latitude || 0,
          longitude: order?.pickupLocation?.longitude || 0,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Force check: Only render markers if coords exist */}
        {order?.pickupLocation && (
          <Marker coordinate={order.pickupLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
          </Marker>
        )}

        {order?.dropoffLocation && (
          <Marker coordinate={order.dropoffLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
          </Marker>
        )}

        {routeCoords.length > 1 && (
          <Polyline 
            coordinates={routeCoords} 
            strokeColor={COLORS.primary} 
            strokeWidth={6} 
            lineJoin="round"
          />
        )}
      </MapView>

      <View style={styles.detailsBox}>
        <View style={styles.card}>
          <Text style={styles.patientName}>{order?.patientName}</Text>
          <View style={styles.divider} />
          <Text style={styles.addrText}><Ionicons name="location" color={COLORS.success} /> {order?.pickupStreet}</Text>
          <Text style={[styles.addrText, { marginTop: 8 }]}><Ionicons name="flag" color={COLORS.danger} /> {order?.dropoffStreet}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.statusBtn, { backgroundColor: status === 'pending' ? COLORS.primary : COLORS.success }]} 
            onPress={handleUpdateStatus}
          >
            <Text style={styles.btnText}>{status === 'pending' ? 'START TRIP' : 'COMPLETE TRIP'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18191a' },
  center: { justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: 'white' },
  detailsBox: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#18191a', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  card: { backgroundColor: '#242526', borderRadius: 20, padding: 20 },
  patientName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#3a3b3c', marginVertical: 12 },
  addrText: { color: '#e4e6eb', fontSize: 14 },
  actionRow: { flexDirection: 'row', marginTop: 15, gap: 12 },
  statusBtn: { flex: 1, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  backBtn: { width: 55, height: 55, borderRadius: 15, backgroundColor: '#3a3b3c', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});