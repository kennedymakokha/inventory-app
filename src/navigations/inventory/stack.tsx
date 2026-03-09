import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";
import { InventoryStackParamList } from "../../../models/navigationTypes";

import { CustomHeaderWithSearch } from "../../components/customHeader";
import InventoryDetails from "../../screens/inventory/inventoryDetails";
import InventoryScreen from "../../screens/inventory/inventory.screen";

export function InventoryStack() {
  const { isDarkMode } = useSettings();
const InventoryStackNav = createNativeStackNavigator<InventoryStackParamList>();
  return (
    <InventoryStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <InventoryStackNav.Screen
        name="inventory_Dashboard"
        component={InventoryScreen}
        options={{   headerShown: false, }}
      />
      <InventoryStackNav.Screen
        name="inventory_Details"
        component={InventoryDetails}
        options={({ route }) => ({
          header: () => (
            <CustomHeaderWithSearch
              noSearch
              title={route.params?.product?.product_name || "Product Details"}
            />
          ),
        })}
      />
    </InventoryStackNav.Navigator>
  );
}