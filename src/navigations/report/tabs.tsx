import { useSettings } from "../../context/SettingsContext";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import DashboardScreen from "../../screens/DashboardScreen";
import CustomHeader from "../../components/customHeader";
import ProductScreen from "../../screens/products/product.screen";
import { CategoriesStack } from "../categories/stack";
import { UsersStack } from "../users/stack";
import SalesReport from "../../screens/reports/sales";
import { InventoryStack } from "../inventory/stack";
import { useSelector } from "react-redux";

const Tab = createBottomTabNavigator();

export function ReportsTabs() {
  const { isDarkMode } = useSettings();

  const tabBackground = isDarkMode ? "#1e293b" : "#f8fafc";
  const activeTint = isDarkMode ? "#d4af37" : "#0f172a";
  const inactiveTint = isDarkMode ? "#cbd5e1" : "#64748b";
  const { user } = useSelector((state: any) => state.auth);
  // Map tab names to header titles
  const headerTitles: Record<string, string> = {
    sales: "Sales",
    Inventory: "Inventory",
    products: "Products",
    users: "Users",
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <CustomHeader title={`${headerTitles[route.name]} Report ` || ""} />,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            sales: "cart",
            Inventory: "cube-outline",
            products: "pricetags",
            users: "people",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: { backgroundColor: tabBackground, borderTopWidth: 0, height: 60 },
      })}
    >
      <Tab.Screen
        name="sales"
        component={SalesReport}
        initialParams={{ filter: "home" }}
      />
      {user.role === "admin" && <Tab.Screen
        name="Inventory"
        component={InventoryStack}
        initialParams={{ filter: "categories" }}
      />}
     
      {user.role === "admin" && <Tab.Screen
        name="users"
        component={UsersStack}
        initialParams={{ filter: "users" }}
      />}
    </Tab.Navigator>
  );
}