import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSettings } from "../../context/SettingsContext";
import { defaultHeaderOptions } from "../navigationOptions";
import { ReportStackParamList } from "../../../models/navigationTypes";
import SalesReport from "../../screens/reports/sales";
import { ReportsTabs } from "./tabs";
import { useSelector } from "react-redux";
import CustomHeader from "../../components/customHeader";

export function ReportStack() {
  const { isDarkMode } = useSettings();
  const ReportStackNav = createNativeStackNavigator<ReportStackParamList>();
  const { user } = useSelector((state: any) => state.auth);
  return (
    <ReportStackNav.Navigator screenOptions={defaultHeaderOptions(isDarkMode)}>
      <ReportStackNav.Screen
        name="salesReport"
        component={user.role === "admin" ? ReportsTabs : SalesReport}
        options={{ header: () => <CustomHeader back title="Reports" /> }}
      />
    </ReportStackNav.Navigator>
  );
}