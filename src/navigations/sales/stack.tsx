import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";

import UsersScreen from "../../screens/users/users.screen";
import { SalesStackParamList, UsersStackParamList } from "../../../models/navigationTypes";
import GroupedProductsForSale from "../../screens/sales";
import SalesScreen from "../../screens/sales/salesScreen";
import CustomHeader from "../../components/customHeader";

export function SalesStack() {
  const { isDarkMode } = useSettings();
  const SalesStackNav = createNativeStackNavigator<SalesStackParamList>();
  return (
    <SalesStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <SalesStackNav.Screen
        name="Sales_Dashboard"
        component={GroupedProductsForSale}
        options={{ header: () => <CustomHeader title="Sales" /> }}
      />
      <SalesStackNav.Screen
        name="Sales_Details"
        component={SalesScreen}
        options={({ route }: any) => {
          console.log(route)
          return {
            header: () => <CustomHeader nodetails back title={`${route.params.name.slice(0,120) + "..."}`} />,
            // title: 
          }
        }}
      // options={{header: () => <CustomHeader back title="Sales" /> }}
      />
    </SalesStackNav.Navigator>
  );
}