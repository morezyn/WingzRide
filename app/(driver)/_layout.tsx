import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Tabs } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { auth, db } from "../../config/firebase";

// Configure how notifications appear when the app is OPEN
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function DriverLayout() {
  const COLORS = {
    bg: "#18191a",
    card: "#242526",
    primary: "#2d88ff",
    text: "#e4e6eb",
    border: "#3a3b3c",
    inactive: "#b0b3b8",
  };

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  async function registerForPushNotifications() {
    if (!Device.isDevice) return; 

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    try {
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "your-project-id-here", // Found in app.json
        })
      ).data;

      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          pushToken: token,
        });
        console.log("Push Token Saved:", token);
      }
    } catch (e) {
      console.log("Error getting token:", e);
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      {/* 1. HOME / ACTIVE TRIP */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Active Trip",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "navigate" : "navigate-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 2. SCHEDULE */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 3. HIDDEN NOTIFICATIONS SCREEN */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, 
        }}
      />

      {/* 4. HIDDEN TRIP MAP / ORDER DETAILS SCREEN */}
      <Tabs.Screen
        name="order_details"
        options={{
          href: null,
        }}
      />

      {/* 5. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}