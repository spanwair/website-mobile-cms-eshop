export type RootStackParamList = {
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
