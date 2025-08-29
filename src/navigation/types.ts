// Tabs
export type BottomTabParamList = {
  HomeTab: undefined; // this tab hosts the Home stack
  Profile: undefined;
};

// Home stack (lives inside HomeTab)
export type HomeStackParamList = {
  Home: undefined;
  BusinessDetail: { id: string };
};
