// src/navigation/BottomTabsNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabParamList } from "./types";
import HomeStackNavigator from "./HomeStackNavigator";
import DashboardStackNavigator from "./DashboardStackNavigator"; // <-- make sure this file exists

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: 4,
          height: 60,
        },
        tabBarIcon: ({ color, size }) => {
          let name: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "HomeTab") name = "home";
          if (route.name === "DashboardTab") name = "grid";

          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: "Home" }}
      />

      {/* This tab shows Dashboard flow. 
          Inside DashboardStackNavigator, if user is not logged in,
          redirect to your WelcomeAuth/Login; if logged in, show dashboard screens. */}
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{ title: "Dashboard" }}
      />
    </Tab.Navigator>
  );
}
