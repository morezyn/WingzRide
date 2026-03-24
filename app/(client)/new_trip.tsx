import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const COLORS = {
  bg: '#18191a',
  card: '#242526',
  primary: '#2d88ff',
  text: '#e4e6eb',
  secondary: '#b0b3b8',
  border: '#3a3b3c',
};

const FormInput = ({ label, icon, value, onChangeText, placeholder, ...props }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={18} color={COLORS.secondary} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.secondary}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        {...props}
      />
    </View>
  </View>
);

export default function NewTrip() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    patientName: user?.displayName || '',
    phone: '',
    clientOrg: 'Private Client', // Default or fetch from user profile
    pickupStreet: '',
    pickupCity: '',
    pickupZip: '',
    dropoffStreet: '',
    dropoffCity: '',
    dropoffZip: '',
    pickupTimeA: '',
    pickupTimeB: '',
    mobilityType: 'Ambulatory',
    vehicleRequired: 'Sedan/Van',
  });

  const handleCreateTrip = async () => {
    if (!formData.patientName || !formData.pickupStreet || !formData.dropoffStreet) {
      Alert.alert("Missing Info", "Please provide patient name and addresses.");
      return;
    }

    setLoading(true);
    try {
      const tripId = `SO-${Math.floor(1000 + Math.random() * 9000)}`;
      
      await addDoc(collection(db, "standing_orders"), {
        ...formData,
        clientId: user?.uid,
        tripId: tripId,
        orderId: Math.floor(10000 + Math.random() * 90000).toString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        isWAV: formData.mobilityType === 'Wheelchair',
        aMiles: 0, // Calculated by dispatcher later
        bMiles: 0,
        totalMiles: 0,
        estFare: 0,
        scheduleDays: ['M', 'W', 'F'], // Defaulting to your schema example
      });
      
      Alert.alert("Success", `Trip ${tripId} requested.`, [
        { text: "OK", onPress: () => router.replace('/(client)/home') }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'New Trip Request',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.sectionLabel}>Rider & Org</Text>
        <View style={styles.card}>
          <FormInput 
            label="PATIENT NAME" icon="person-outline" 
            value={formData.patientName} 
            onChangeText={(t: string) => setFormData({...formData, patientName: t})} 
          />
          <FormInput 
            label="CLIENT ORGANIZATION" icon="business-outline" 
            value={formData.clientOrg} 
            onChangeText={(t: string) => setFormData({...formData, clientOrg: t})} 
          />
        </View>

        <Text style={styles.sectionLabel}>Pickup Location</Text>
        <View style={styles.card}>
          <FormInput 
            label="STREET" icon="location-outline" 
            value={formData.pickupStreet} 
            onChangeText={(t: string) => setFormData({...formData, pickupStreet: t})} 
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <FormInput label="CITY" value={formData.pickupCity} onChangeText={(t: string) => setFormData({...formData, pickupCity: t})} />
            </View>
            <View style={{ width: 100 }}>
              <FormInput label="ZIP" value={formData.pickupZip} onChangeText={(t: string) => setFormData({...formData, pickupZip: t})} />
            </View>
          </View>
          <FormInput label="PICKUP TIME (A)" icon="time-outline" placeholder="10:00" value={formData.pickupTimeA} onChangeText={(t: string) => setFormData({...formData, pickupTimeA: t})} />
        </View>

        <Text style={styles.sectionLabel}>Dropoff Location</Text>
        <View style={styles.card}>
          <FormInput label="STREET" icon="flag-outline" value={formData.dropoffStreet} onChangeText={(t: string) => setFormData({...formData, dropoffStreet: t})} />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <FormInput label="CITY" value={formData.dropoffCity} onChangeText={(t: string) => setFormData({...formData, dropoffCity: t})} />
            </View>
            <View style={{ width: 100 }}>
              <FormInput label="ZIP" value={formData.dropoffZip} onChangeText={(t: string) => setFormData({...formData, dropoffZip: t})} />
            </View>
          </View>
          <FormInput label="RETURN TIME (B)" icon="repeat-outline" placeholder="14:30" value={formData.pickupTimeB} onChangeText={(t: string) => setFormData({...formData, pickupTimeB: t})} />
        </View>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: COLORS.primary }]} 
          onPress={handleCreateTrip}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Trip</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20 },
  sectionLabel: { color: COLORS.secondary, fontSize: 11, fontWeight: 'bold', marginBottom: 8, marginLeft: 5, letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row' },
  inputContainer: { marginBottom: 12 },
  label: { color: COLORS.secondary, fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 10, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#fff', fontSize: 14 },
  btn: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});