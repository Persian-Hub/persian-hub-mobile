// src/navigation/HomeStackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeStackParamList } from "./types";

import HomeScreen from "../screens/HomeScreen";
import BusinessDetail from "../screens/BusinessDetail";
import ReviewForm from "../screens/ReviewForm";
import ReportBusiness from "../screens/ReportBusiness";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen
        name="BusinessDetail"
        component={BusinessDetail}
      />
      <Stack.Screen
        name="ReviewForm"
        component={ReviewForm}
        options={{ headerShown: true, title: "Write a Review" }}
      />
      <Stack.Screen
        name="ReportBusiness"
        component={ReportBusiness}
        options={{ headerShown: true, title: "Report this business" }}
      />
    </Stack.Navigator>
  );
}
