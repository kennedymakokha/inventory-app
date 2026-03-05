import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";

import UsersScreen from "../../screens/users/users.screen";
import { UsersStackParamList } from "../../../models/navigationTypes";

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
    </UsersStackNav.Navigator>
  );
}