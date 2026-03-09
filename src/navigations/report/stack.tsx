import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";
import { ReportStackParamList } from "../../../models/navigationTypes";
import SalesReport from "../../screens/reports/sales";
import { ReportsTabs } from "./tabs";

export function ReportStack() {
  const { isDarkMode } = useSettings();
const ReportStackNav = createNativeStackNavigator<ReportStackParamList>();
  return (
    <ReportStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <ReportStackNav.Screen
        name="salesReport"
        component={ReportsTabs}
        options={{ headerShown: false }}
      />
    </ReportStackNav.Navigator>
  );
}