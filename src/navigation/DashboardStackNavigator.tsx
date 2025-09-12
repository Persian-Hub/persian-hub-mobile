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
import ProfileSettings from "../screens/dashboard/ProfileSettings"; 
import SupportLegalHome from "../screens/dashboard/SupportLegalHome";
import TermsScreen from "../screens/support/TermsScreen";
import PrivacyPolicyScreen from "../screens/support/PrivacyPolicyScreen";
import DataDeletionScreen from "../screens/support/DataDeletionScreen";
import ChildSafetyScreen from "../screens/support/ChildSafetyScreen";
import ContactUsScreen from "../screens/support/ContactUsScreen";
import ReportIssueScreen from "../screens/support/ReportIssueScreen";
import AdminHome from "../screens/admin/AdminHome"; // ⬅️ NEW
import AdminStackNavigator from "./AdminStackNavigator";
import ForgotPassword from "../screens/auth/ForgotPassword"; // <-- add
import ResetPassword from "../screens/auth/ResetPassword";

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardHome} />
      <Stack.Screen name="MyBusinesses" component={MyBusinesses} />
      <Stack.Screen name="AddBusiness" component={AddBusiness} />
      <Stack.Screen name="EditBusiness" component={EditBusiness} options={{ title: "Edit Business" }} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettings} options={{ headerShown: true, title: "Profile & Settings"}} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{ headerShown: true, title: "Forgot password" }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{ headerShown: true, title: "Reset Password" }}
      />
      <Stack.Screen name="RequestVerificationList" component={RequestVerificationList} />
      <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} />

      <Stack.Screen name="SupportLegalHome" component={SupportLegalHome} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="DataDeletion" component={DataDeletionScreen} />
      <Stack.Screen name="ChildSafety" component={ChildSafetyScreen} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="AdminStack" component={AdminStackNavigator} />

    </Stack.Navigator>
  );
}
