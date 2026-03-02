import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";
import { CategoriesStackParamList } from "../../../models/navigationTypes";
import CategoryScreen from "../../screens/categories copy/categories.screen";
import { CustomHeaderWithSearch } from "../../components/customHeader";

export function CategoriesStack() {
  const { isDarkMode } = useSettings();
const CategoriesStackNav = createNativeStackNavigator<CategoriesStackParamList>();
  return (
    <CategoriesStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <CategoriesStackNav.Screen
        name="categories_Dashboard"
        component={CategoryScreen}
        options={{headerShown: false}}
      />
    </CategoriesStackNav.Navigator>
  );
}