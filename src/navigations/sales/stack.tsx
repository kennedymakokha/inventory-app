import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";

import UsersScreen from "../../screens/users/users.screen";
import { SalesStackParamList, UsersStackParamList } from "../../../models/navigationTypes";
import GroupedProductsForSale from "../../screens/sales";
import SalesScreen from "../../screens/sales/salesScreen";

export function SalesStack() {
  const { isDarkMode } = useSettings();
  const SalesStackNav = createNativeStackNavigator<SalesStackParamList>();
  return (
    <SalesStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <SalesStackNav.Screen
        name="Sales_Dashboard"
        component={GroupedProductsForSale}
        options={{ headerShown: false }}
      />
      <SalesStackNav.Screen
        name="Sales_Details"
        component={SalesScreen}
        options={{ headerShown: false }}
      />
    </SalesStackNav.Navigator>
  );
}