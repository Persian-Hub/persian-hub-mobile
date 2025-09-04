// src/navigation/types.ts
import type { NavigatorScreenParams } from "@react-navigation/native";

// Bottom tabs: Home + Dashboard
export type BottomTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
};

// Home stack (browsing)
export type HomeStackParamList = {
  Home: undefined;
  BusinessDetail: { id: string };
  ReviewForm: { businessId: string; businessName: string };
  ReportBusiness: { businessId: string; businessName?: string };
};

// (Optional) Dashboard stack types if you want to type screens there too
export type DashboardStackParamList = {
  DashboardHome: undefined;
  MyBusinesses: undefined;
  AddBusiness: undefined;
  RequestVerificationList: undefined;
  RequestVerification: { preselectBusinessId?: string } | undefined;
  EditBusiness: { businessId: string; adminOverride?: boolean }; 
  ProfileSettings: undefined; 
  SupportLegalHome: undefined;
  Terms: undefined;
  Privacy: undefined;
  DataDeletion: undefined;
  ChildSafety: undefined;
  ContactUs: undefined;
  ReportIssue: { prefillSubject?: string } | undefined;
  AdminStack: NavigatorScreenParams<AdminStackParamList>; // <— NESTED ADMIN
  ForgotPassword: undefined;
  ResetPassword: undefined; // opened from recovery deeplink


};


export type AdminStackParamList = {
  // drill-down screens you can build next:
  AdminHome: undefined;
  AllBusinesses: undefined;
  EditBusiness: { businessId: string; adminOverride?: boolean };  PendingBusinesses: undefined;
  PendingReviews: undefined;
  CategoryRequests: undefined;
  VerificationRequests: undefined;
  BusinessReports: undefined;
  Users: undefined;
  AllReviews: undefined;
  Categories: undefined;
  Promotions: undefined;

};
