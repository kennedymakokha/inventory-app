import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";

import UsersScreen from "../../screens/users/users.screen";
import { UsersStackParamList } from "../../../models/navigationTypes";
import UserScreen from "../../screens/users/user.screen";
import { noticationsStack } from "../notifications/stack";
import NotificationsScreen from "../../screens/notifications";
import CustomHeader from "../../components/customHeader";

export function UsersStack() {
  const { isDarkMode } = useSettings();
const UsersStackNav = createNativeStackNavigator<UsersStackParamList>();
  return (
    <UsersStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <UsersStackNav.Screen
        name="Users_Dashboard"
        component={UsersScreen}
        options={{headerShown: false}}
      />
      <UsersStackNav.Screen
        name="User_Dashboard"
        component={UserScreen}
        options={{ header: () => <CustomHeader back title="Inventory" /> }}
      />
      <UsersStackNav.Screen
        name="User_Notifications"
        component={NotificationsScreen}
        options={{headerShown: false}}
      />
    </UsersStackNav.Navigator>
  );
}