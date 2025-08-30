// App.tsx
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeStackNavigator from "./src/navigation/HomeStackNavigator";
import AuthStackNavigator from "./src/navigation/AuthStackNavigator";
import { BottomTabParamList } from "./src/navigation/types";

const Tab = createBottomTabNavigator<BottomTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: "#2563EB",
              tabBarInactiveTintColor: "#94A3B8",
              tabBarStyle: { height: 60, paddingTop: 6, paddingBottom: 8 },
              tabBarIcon: ({ color, size }) => {
                const iconName =
                  route.name === "HomeTab"
                    ? ("home-outline" as const)
                    : ("person-circle-outline" as const);
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
            })}
          >
            <Tab.Screen
              name="HomeTab"
              component={HomeStackNavigator}
              options={{ title: "Home" }}
            />
            <Tab.Screen
              name="Account"
              component={AuthStackNavigator}
              options={{ title: "Account" }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
