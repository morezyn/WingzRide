# WingzRide Application Documentation

## Overview

WingzRide is a mobile application built with **Expo (React Native)** designed to manage Non-Emergency Medical Transportation (NEMT). It facilitates real-time coordination between Dispatchers, Drivers, and Clients (Riders), utilizing **Firebase** for backend services (Authentication and Firestore Database).

## Technical Stack

- **Framework:** React Native / Expo
- **Routing:** Expo Router (File-based routing)
- **Backend:** Firebase Firestore (NoSQL Database)
- **Auth:** Firebase Authentication
- **Maps:** `react-native-maps` (Google Maps provider) & `expo-location`
- **Styling:** Custom StyleSheet objects (Dark mode centric design)

## User Roles & Navigation

The application handles redirection logic in `app/index.tsx`. Upon authentication, the app checks the `role` field in the user's Firestore document to route them to the correct dashboard:

1. **Driver**: `/(driver)/home`
2. **Dispatcher**: `/(dispatcher)/home`
3. **Client**: `/(client)/home`

## Driver Module Workflow

The provided codebase focuses heavily on the Driver experience. Below is the functionality breakdown:

### 1. Action Center (Notifications)

**File:** `app/(driver)/notifications.tsx`

- Drivers receive notifications for new trip assignments (`type: 'assignment'`).
- **Accepting a Trip:**
  - Updates the order status to `accepted`.
  - Sets the `driverAcknowledgeAt` timestamp.
  - Redirects the driver to the Home screen to start the trip.
- **Declining a Trip:**
  - Resets the order status to `pending`.
  - Removes the `assignedDriverId`, effectively returning the trip to the Dispatcher pool.

### 2. Active Trip Management (Home)

**File:** `app/(driver)/home.tsx`

- Displays the currently active trip if one exists with status: `assigned`, `accepted`, `en-route`, or `arrived`.
- **Status Lifecycle:**
  - **ASSIGNED:** Trip offered to driver (Waiting for acceptance).
  - **ACCEPTED:** Driver confirmed. Button shows "START TRIP".
  - **EN-ROUTE:** Driver is driving to pickup. Button shows "MARK ARRIVED".
  - **ARRIVED:** Driver is at pickup. Button shows "COMPLETE TRIP".
  - **COMPLETED:** Trip finished; removed from active view.

### 3. Trip Details & Navigation

**File:** `app/(driver)/order_details.tsx`

- **Mapping:**
  - Uses `react-native-maps` to show Pickup (Green) and Dropoff (Red) markers.
  - Fetches route geometry from OSRM (Open Source Routing Machine) or falls back to a straight line.
- **Geocoding:**
  - If the order data lacks explicit Latitude/Longitude, the app attempts to Geocode the string addresses on the fly using `expo-location`.

### 4. Schedule

**File:** `app/(driver)/schedule.tsx`

- A calendar view allowing drivers to see upcoming `accepted` trips.
- Filters trips by the selected date.

### 5. Profile & Settings

**File:** `app/(driver)/profile.tsx`

- Displays driver info (Name, Vehicle Model, Plate Number).
- **Duty Status:** A toggle switch to mark the driver as Available or Off-duty.
- **Logout:** Signs the user out and redirects to the login screen.

## Data Models (Firestore)

### `standing_orders` (Collection)

Represents a single trip.
| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Unique Identifier |
| `assignedDriverId` | String | UID of the driver |
| `status` | String | `pending` \| `assigned` \| `accepted` \| `en-route` \| `arrived` \| `completed` |
| `pickupStreet` | String | Physical address text |
| `pickupLocation` | GeoPoint | `{ latitude, longitude }` |
| `patientName` | String | Name of the rider |
| `mobilityType` | String | e.g., "Ambulatory", "Wheelchair" |

### `users` (Collection)

Stores user profile data.

- **Fields:** `email`, `role`, `pushToken`, `vehicleModel`, `plateNumber`.

### `notifications` (Collection)

Temporary records for alerts.

- **Fields:** `userId`, `orderId`, `type`, `title`, `message`.

## Utilities

### CSV Seeder

**File:** `utils/seeder.ts`

- Allows the bulk import of orders via CSV file.
- Uses `expo-document-picker` to select files and `papaparse` to read them.
- Contains logic to map various CSV header formats (e.g., "Pickup Street" vs "Pickup Stre") to the Firestore schema.
