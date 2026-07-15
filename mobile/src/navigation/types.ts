export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Items: undefined;
  Profile: undefined;
  Admin: undefined;
  Settings: undefined;
};

export type ItemsStackParamList = {
  ItemsList: undefined;
  ItemDetail: { id: string };
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminItems: undefined;
  AdminUsers: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};
