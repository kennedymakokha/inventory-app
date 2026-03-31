import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";

import { CustomHeaderWithSearch } from "../../components/customHeader";
import { NotificationsStackParamList } from "../../../models/navigationTypes";
import NotificationDetails from "../../screens/notifications/notificationDetails";
import Notifications from "../../screens/notifications";


export function noticationsStack() {
  const { isDarkMode } = useSettings();
  const noticationsStackNav = createNativeStackNavigator<NotificationsStackParamList>();
  return (
    <noticationsStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <noticationsStackNav.Screen
        name="Notifications_Dashboard"
        component={Notifications}
        options={{ headerShown: false, }}
      />
      <noticationsStackNav.Screen
        name="Notifications_Details"
        component={NotificationDetails}
        options={{ headerShown: false, }}
      // options={({ route }) => ({
      //   header: () => (
      //     <CustomHeaderWithSearch
      //       nodetail
      //       center
      //       noSearch
      //       title={route.params?.product?.product_name || "Product Details"}
      //     />
      //   ),
      // })}
      />
    </noticationsStackNav.Navigator>
  );
}