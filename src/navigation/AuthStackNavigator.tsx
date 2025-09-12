import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeAuth from "../screens/auth/WelcomeAuth";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmail";
import ResetPassword from "../screens/auth/ResetPassword";


export type AuthStackParamList = {
  WelcomeAuth: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email?: string };
  ResetPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="WelcomeAuth" component={WelcomeAuth} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ title: "Set a new password" }} />

    </Stack.Navigator>
  );
}
