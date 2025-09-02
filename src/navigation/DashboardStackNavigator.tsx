// src/navigation/DashboardStackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "./types";
import DashboardHome from "../screens/dashboard/DashboardHome";
import MyBusinesses from "../screens/dashboard/MyBusinesses";
import AddBusiness from "../screens/dashboard/AddBusiness";
import RequestVerificationList from "../screens/dashboard/RequestVerificationList";
import RequestVerificationScreen from "../screens/RequestVerificationScreen";
import EditBusiness from "../screens/dashboard/EditBusiness";
import ProfileSettings from "../screens/dashboard/ProfileSettings"; // NEW

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardHome} />
      <Stack.Screen name="MyBusinesses" component={MyBusinesses} />
      <Stack.Screen name="AddBusiness" component={AddBusiness} />
      <Stack.Screen name="EditBusiness" component={EditBusiness} options={{ title: "Edit Business" }} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettings} options={{ headerShown: true, title: "Profile & Settings"}} />
      
      <Stack.Screen name="RequestVerificationList" component={RequestVerificationList} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />
    </Stack.Navigator>
  );
}
