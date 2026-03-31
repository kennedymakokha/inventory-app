// navigationTypes.ts
export type AuthStackParamList = {
  login: undefined;
  forgetPass: undefined;
  activation: { emailOrPhone: string };
  resetPassword: { emailOrPhone: string; otp: string };
};

export type RootStackParamList = {
  dashboard: undefined;
  products: { filter?: "all" | "synced" | "unsynced" };
  inventory: undefined;
  categories: undefined;
  sales: undefined;
  salesreport: undefined;
  settings: undefined;
  business: undefined;
  profile: undefined
};

export type InventoryStackParamList = {
  inventory_Dashboard: undefined;
  inventory_Details: { product: { product_name: string;[key: string]: any } };
};

export type NotificationsStackParamList = {
  Notifications_Dashboard: undefined;
  Notifications_Details: { notification: { title: string; body: string } };
};

export type CategoriesStackParamList = {
  categories_Dashboard: undefined;
};
export type UsersStackParamList = {
  Users_Dashboard: undefined;
  User_Notifications: { user: any };
  User_Dashboard: { user: any }; // ✅ match your item type
};
export type SalesStackParamList = {
  Sales_Dashboard: undefined;
  Sales_Details: { category: String };
};
export type ReportStackParamList = {
  salesReport: undefined;
};