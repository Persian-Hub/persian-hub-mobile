import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminStackParamList } from "./types";

import AdminHome from "../screens/admin/AdminHome";

// (stubs/placeholders for later detail screens)
// import PendingBusinesses from "../screens/admin/PendingBusinesses";
// ... etc.

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHome" component={AdminHome} />
      {/*
      <Stack.Screen name="PendingBusinesses" component={PendingBusinesses} />
      <Stack.Screen name="PendingReviews" component={PendingReviews} />
      <Stack.Screen name="CategoryRequests" component={CategoryRequests} />
      <Stack.Screen name="VerificationRequests" component={VerificationRequests} />
      <Stack.Screen name="BusinessReports" component={BusinessReports} />
      <Stack.Screen name="AllBusinesses" component={AllBusinesses} />
      <Stack.Screen name="Users" component={Users} />
      <Stack.Screen name="AllReviews" component={AllReviews} />
      <Stack.Screen name="Categories" component={Categories} />
      <Stack.Screen name="Promotions" component={Promotions} />
      */}
    </Stack.Navigator>
  );
}
