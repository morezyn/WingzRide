/**
 * TripStatus represents the lifecycle of a trip.
 * - pending: Order created but no driver assigned.
 * - assigned: Dispatcher has assigned a driver.
 * - accepted: Driver has accepted the trip.
 * - en-route: Driver has started moving toward the pickup.
 * - arrived: Driver is at the pickup location.
 * - completed: Trip is successfully finished.
 * - cancelled: Trip was voided by dispatcher or client.
 */
export type TripStatus = 'pending' | 'assigned' | 'accepted' | 'en-route' | 'arrived' | 'completed' | 'cancelled';

/**
 * Helper interface for geographic coordinates
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface StandingOrder {
  // Primary Identifiers
  tripId: string;       // From CSV: "Trip ID"
  orderId: string;      // From CSV: "Order ID" (used as Firestore Document ID)
  clientOrg: string;    // From CSV: "Client Org"
  
  // Patient Information
  patientName: string;  // From CSV: "Rider Nam" or "Rider Name"
  phone: string;        // From CSV: "Phone"
  
  // Location Data (Text)
  pickupStreet: string;
  pickupCity: string;
  pickupCounty: string;
  pickupZip: string;
  dropoffStreet: string;
  dropoffCity: string;
  dropoffCounty: string;
  dropoffZip: string;

  // Geographic Data (Coordinates for Map/Tracking)
  pickupLocation?: GeoPoint; 
  dropoffLocation?: GeoPoint;
  
  // Schedule & Logistics
  scheduleDays: string[]; 
  pickupTimeA: string;    
  pickupTimeB: string;    
  
  // Vehicle Requirements
  mobilityType: string;   
  vehicleRequired: string; 
  isWAV: boolean;         
  
  // Financials & Distance
  aMiles: number;         
  bMiles: number;         
  totalMiles: number;     
  estFare: number;        
  
  // System & Assignment Status
  status: TripStatus;
  createdAt: string;      
  
  // Driver Assignment Fields
  assignedDriverId?: string;   
  assignedDriverName?: string; 
  assignedAt?: string;         
  driverAcknowledgeAt?: any;   // Firestore Timestamp
  lastUpdated?: any;           // Firestore Timestamp for status changes
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'client';
  phoneNumber?: string;
  createdAt: string;
  isOnline?: boolean;
  
  // Push Notifications
  pushToken?: string;          // For Expo Push Notifications
  
  // Driver Specific Details
  vehicleModel?: string;       // e.g., "Silver Transit Van"
  plateNumber?: string;        // e.g., "ABC-1234"
}

/**
 * Trip interface for the live tracking collection
 */
export interface Trip {
  id: string;
  orderId: string;
  clientId: string;
  driverId: string;
  status: TripStatus;
  currentLocation: GeoPoint;
  pickupLocation: GeoPoint;
  dropoffLocation: GeoPoint;
  lastUpdated: any;
}