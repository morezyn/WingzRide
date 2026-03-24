import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';

export default function TripInfo() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  
  const mapRef = useRef<MapView>(null);

  const COLORS = {
    bg: "#18191a",
    primary: "#2d88ff",
    accent: "#42b72a", // Pickup (Green)
    danger: "#f35e7a", // Dropoff (Red)
    text: "#ffffff",
    subtext: "#b0b3b8"
  };

  /**
   * Fetches the actual road-following path from OSRM.
   * If OSRM fails, it falls back to a straight line between points.
   */
  const fetchRoadRoute = async (start: any, end: any) => {
    if (!start?.latitude || !end?.latitude) return;

    try {
      // Use 5 decimal places for API stability
      const startLng = start.longitude.toFixed(5);
      const startLat = start.latitude.toFixed(5);
      const endLng = end.longitude.toFixed(5);
      const endLat = end.latitude.toFixed(5);

      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=polyline`;
      
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.code === 'Ok' && json.routes?.length > 0) {
        const decoded = polyline.decode(json.routes[0].geometry);
        const roadPoints = decoded.map((p: number[]) => ({ 
          latitude: p[0], 
          longitude: p[1] 
        }));
        
        setRouteCoords(roadPoints);

        // Fit map to coordinates
        mapRef.current?.fitToCoordinates(roadPoints, {
            edgePadding: { top: 80, right: 80, bottom: 350, left: 80 },
            animated: true
        });
      } else {
        throw new Error("OSRM Routing failed");
      }
    } catch (e) {
      console.log("Routing Error, using straight line fallback:", e);
      // Fallback: Just draw a straight line between the two markers
      const fallbackLine = [
        { latitude: start.latitude, longitude: start.longitude },
        { latitude: end.latitude, longitude: end.longitude }
      ];
      setRouteCoords(fallbackLine);
      mapRef.current?.fitToCoordinates(fallbackLine, {
        edgePadding: { top: 80, right: 80, bottom: 350, left: 80 },
        animated: true
      });
    }
  };

  useEffect(() => {
    if (!orderId) return;

    const unsub = onSnapshot(doc(db, "standing_orders", orderId), async (docSnap) => {
      if (docSnap.exists()) {
        let data = docSnap.data();

        // 1. Geocode Pickup if coordinates are missing
        if (!data.pickupLocation?.latitude && data.pickupStreet) {
          const res = await Location.geocodeAsync(`${data.pickupStreet}, ${data.pickupCity || ''}`);
          if (res.length > 0) {
            data.pickupLocation = { latitude: res[0].latitude, longitude: res[0].longitude };
          }
        }

        // 2. Geocode Dropoff if coordinates are missing
        if (!data.dropoffLocation?.latitude && data.dropoffStreet) {
          const res = await Location.geocodeAsync(`${data.dropoffStreet}, ${data.dropoffCity || ''}`);
          if (res.length > 0) {
            data.dropoffLocation = { latitude: res[0].latitude, longitude: res[0].longitude };
          }
        }

        setOrder(data);

        // 3. Draw the line
        if (data.pickupLocation && data.dropoffLocation) {
            fetchRoadRoute(data.pickupLocation, data.dropoffLocation);
        }
      } else {
        Alert.alert("Error", "Trip details not found.");
      }
      setLoading(false);
    }, (err) => {
        console.error("Firebase Snapshot Error:", err);
        setLoading(false);
    });

    return () => unsub();
  }, [orderId]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Trip Summary", headerTintColor: '#fff' }} />

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: order?.pickupLocation?.latitude || 34.246,
          longitude: order?.pickupLocation?.longitude || -85.186,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* PICKUP MARKER (Green) */}
        {order?.pickupLocation?.latitude && (
          <Marker coordinate={order.pickupLocation} anchor={{ x: 0.5, y: 0.5 }}>
             <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
          </Marker>
        )}

        {/* DROPOFF MARKER (Red) */}
        {order?.dropoffLocation?.latitude && (
          <Marker coordinate={order.dropoffLocation} anchor={{ x: 0.5, y: 0.5 }}>
             <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
          </Marker>
        )}

        {/* THE LINE (Road-based or Straight Fallback) */}
        {routeCoords.length > 0 && (
          <Polyline 
            coordinates={routeCoords} 
            strokeColor={COLORS.primary} 
            strokeWidth={6}
            lineJoin="round"
          />
        )}
      </MapView>

      <View style={styles.infoPanel}>
        <Text style={styles.patientName}>{order?.patientName || "Route Details"}</Text>
        
        <View style={styles.addressRow}>
          <Ionicons name="location" size={18} color={COLORS.accent} />
          <Text style={styles.addressText} numberOfLines={1}>
            {order?.pickupStreet}, {order?.pickupCity}
          </Text>
        </View>

        <View style={[styles.addressRow, { marginTop: 12 }]}>
          <Ionicons name="flag" size={18} color={COLORS.danger} />
          <Text style={styles.addressText} numberOfLines={1}>
            {order?.dropoffStreet}, {order?.dropoffCity}
          </Text>
        </View>

        <View style={styles.timeContainer}>
           <View>
             <Text style={styles.label}>TIME A</Text>
             <Text style={styles.timeVal}>{order?.pickupTimeA || 'N/A'}</Text>
           </View>
           <View>
             <Text style={styles.label}>TIME B</Text>
             <Text style={styles.timeVal}>{order?.pickupTimeB || 'N/A'}</Text>
           </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#18191a" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#18191a' },
  map: { flex: 1 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: 'white', elevation: 5 },
  infoPanel: { 
    backgroundColor: "#242526", 
    padding: 25, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    marginTop: -32,
    paddingBottom: 40 
  },
  patientName: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressText: { color: '#e4e6eb', fontSize: 15, flex: 1 },
  timeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 25, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#3a3b3c' 
  },
  label: { color: '#b0b3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  timeVal: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});