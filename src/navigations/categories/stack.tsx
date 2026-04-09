import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";
import { CategoriesStackParamList } from "../../../models/navigationTypes";

import CustomHeader, { CustomHeaderWithSearch } from "../../components/customHeader";
import CategoryScreen from "../../screens/categories/categories.screen";
import CategoryDetailsScreen from "../../screens/categories/categoryDetails";

export function CategoriesStack() {
  const { isDarkMode } = useSettings();
  const CategoriesStackNav = createNativeStackNavigator<CategoriesStackParamList>();
  return (
    <CategoriesStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <CategoriesStackNav.Screen
        name="categories_Dashboard"
        component={CategoryScreen}
        options={{ headerShown: true, header: () => <CustomHeader title="Inventory" /> }}
      />
      <CategoriesStackNav.Screen
        name="categories_Details"
        component={CategoryDetailsScreen}
        options={({ route }: any) => {
          console.log(route)
          return {
            header: () => <CustomHeader back title={`${route.params.category.category_name.slice(0, 15) + "..."}`} />,
            // title: 
          }
        }}
      />
    </CategoriesStackNav.Navigator>
  );
}