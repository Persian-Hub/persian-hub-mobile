import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeStackParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";
import BusinessDetail from "../screens/BusinessDetail";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BusinessDetail"
        component={BusinessDetail}
        options={{ title: "Business" }}
      />
    </Stack.Navigator>
  );
}
