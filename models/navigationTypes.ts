// navigationTypes.ts
export type AuthStackParamList = {
  login: undefined;
};

export type RootStackParamList = {
  dashboard: undefined;
  products: { filter?: "all" | "synced" | "unsynced" };
  inventory: undefined;
  categories: undefined;
  sales: undefined;
  salesreport: undefined;
  settings: undefined;
};

export type InventoryStackParamList = {
  inventory_Dashboard: undefined;
  inventory_Details: { product: { product_name: string; [key: string]: any } };
};

export type CategoriesStackParamList = {
  categories_Dashboard: undefined;
};
export type UsersStackParamList = {
  Users_Dashboard: undefined;
};

export type ReportStackParamList = {
  salesReport: undefined;
};