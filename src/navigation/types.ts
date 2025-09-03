// src/navigation/types.ts

// Bottom tabs: Home + Dashboard
export type BottomTabParamList = {
  HomeTab: undefined;
  DashboardTab: undefined;
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
  EditBusiness: { businessId: string }; 
  ProfileSettings: undefined; 
};
