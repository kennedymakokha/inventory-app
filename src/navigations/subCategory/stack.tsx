import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";
import { CategoriesStackParamList, SubCategoriesStackParamList } from "../../../models/navigationTypes";
import SubCategoryScreen from "../../screens/subCategory/subCategoryScreen";



export function SubCategoriesStack() {
  const { isDarkMode } = useSettings();
const SubCategoriesStackNav = createNativeStackNavigator<SubCategoriesStackParamList>();
  return (
    <SubCategoriesStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <SubCategoriesStackNav.Screen
        name="sub_categories_Dashboard"
        component={SubCategoryScreen}
        options={{headerShown: false}}
      />
    </SubCategoriesStackNav.Navigator>
  );
}