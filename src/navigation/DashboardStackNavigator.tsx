// src/navigation/DashboardStackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardHome from "../screens/dashboard/DashboardHome";
import MyBusinesses from "../screens/dashboard/MyBusinesses";

export type DashboardStackParamList = {
  DashboardHome: undefined;
  MyBusinesses: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardHome"
        component={DashboardHome}
        options={{ title: "Dashboard" }}
      />
      <Stack.Screen
        name="MyBusinesses"
        component={MyBusinesses}
        options={{ title: "My Businesses" }}
      />
    </Stack.Navigator>
  );
}
