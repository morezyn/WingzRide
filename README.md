# WingzRide

WingzRide is a mobile application built with **Expo (React Native)** designed to manage Non-Emergency Medical Transportation (NEMT). It facilitates real-time coordination between Dispatchers, Drivers, and Clients (Riders), utilizing **Firebase** for backend services (Authentication and Firestore Database).

## 🚀 Overview

WingzRide streamlines the logistics of medical transportation by providing:
- Real-time trip assignment and tracking.
- Role-based dashboards for Drivers, Dispatchers, and Clients.
- Automated geocoding and routing.
- Comprehensive status lifecycles for trips (Assigned -> Accepted -> En-route -> Arrived -> Completed).

## 🛠 Technical Stack

- **Framework:** React Native / Expo
- **Routing:** Expo Router (File-based routing)
- **Backend:** Firebase Firestore (NoSQL Database)
- **Auth:** Firebase Authentication
- **Maps:** `react-native-maps` (Google Maps provider) & `expo-location`
- **Styling:** Custom StyleSheet objects with a dark-mode centric design.

## 📱 User Roles & Navigation

The application handles redirection logic in `app/index.tsx`. Upon authentication, the app checks the `role` field in the user's Firestore document to route them to the correct dashboard:

| Role | Route | Description |
|------|-------|-------------|
| **Driver** | `/(driver)/home` | Manage active trips, view schedule, and update duty status. |
| **Dispatcher** | `/(dispatcher)/home` | Oversee fleet operations and assign trips. |
| **Client** | `/(client)/home` | View trip history, receipts, and current ride status. |

## 📦 Features

### Driver Module
- **Action Center:** Real-time notifications for new assignments.
- **Active Trip Management:** Lifecycle buttons (Start Trip, Mark Arrived, Complete) and navigation.
- **Schedule:** Calendar view for upcoming accepted trips.
- **Profile:** Vehicle info and "On Duty" status toggle.

### Utilities
- **CSV Seeder:** Bulk import of orders via `utils/seeder.ts` using `expo-document-picker` and `papaparse`.

## 🗄 Data Models

The core data is stored in Firebase Firestore:
- **`standing_orders`**: Represents individual trips with status, location data, and assigned driver.
- **`users`**: Profiles for all roles including push tokens and vehicle details.
- **`notifications`**: Temporary alerts for app interactions.

## 🏁 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npx expo start
   ```

3. **Firebase Configuration**
   Ensure your `config/firebase.ts` is set up with your specific Firebase project credentials.
