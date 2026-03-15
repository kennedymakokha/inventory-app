import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList, RootStackParamList } from "../../models/navigationTypes";
import { defaultHeaderOptions } from "./navigationOptions";
import { DashboardTabs } from "./dasboard/tabs";
import CustomHeader, { CustomHeaderWithSearch } from "../components/customHeader";
import ProductScreen from "../screens/products/product.screen";
import { InventoryStack } from "./inventory/stack";
import { CategoriesStack } from "./categories/stack";
import SalesScreen from "../screens/sales/salesScreen";
import { ReportStack } from "./report/stack";
import SettingsScreen from "../screens/settingsScreen";
import { useSettings } from "../context/SettingsContext";
import { useSelector } from "react-redux";
import Dashboard from "../screens/DashboardScreen";
import { SalesStack } from "./sales/stack";
import BusinessProfileScreen from "../screens/Business";
import UserProfileScreen from "../screens/profile";

export function RootStack() {
  const { isDarkMode } = useSettings();
  const RootStackNav = createNativeStackNavigator<RootStackParamList>();
  const { user } = useSelector((state: any) => state.auth);


  return (
    <RootStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <RootStackNav.Screen
        name="dashboard"
        component={user.role === "admin" ? DashboardTabs : Dashboard}
        options={{ header: () => <CustomHeader title="Dashboard" /> }}
      />
      <RootStackNav.Screen
        name="products"
        component={ProductScreen}
        options={{ header: () => <CustomHeader  title="Products" /> }}
      />
      <RootStackNav.Screen
        name="inventory"
        component={InventoryStack}
        options={{ headerShown: false }}
      />
      <RootStackNav.Screen
        name="categories"
        component={CategoriesStack}
        options={{ headerShown: false }}
      />
      <RootStackNav.Screen
        name="sales"
        component={SalesStack}
        options={{ header: () => <CustomHeader  title="Sales" /> }}
      />
      <RootStackNav.Screen
        name="salesreport"
        component={ReportStack}
        options={{ headerShown: false }}
      />
      <RootStackNav.Screen
        name="business"
        component={BusinessProfileScreen}
        options={{ header: () => <CustomHeader  title="My Business" /> }}
      />
      <RootStackNav.Screen
        name="profile"
        component={UserProfileScreen}
        options={{ header: () => <CustomHeader  title="My Profile" /> }}
      />
      <RootStackNav.Screen
        name="settings"
        component={SettingsScreen}
        options={{ header: () => <CustomHeader  title="Settings" /> }}
      />
    </RootStackNav.Navigator>
  );
}