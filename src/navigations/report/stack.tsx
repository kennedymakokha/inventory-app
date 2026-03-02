import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";
import { ReportStackParamList } from "../../../models/navigationTypes";
import SalesReport from "../../screens/reports/sales";

export function ReportStack() {
  const { isDarkMode } = useSettings();
const ReportStackNav = createNativeStackNavigator<ReportStackParamList>();
  return (
    <ReportStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <ReportStackNav.Screen
        name="salesReport"
        component={SalesReport}
        options={{ headerShown: false }}
      />
    </ReportStackNav.Navigator>
  );
}