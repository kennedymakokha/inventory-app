import { useSettings } from "../../context/SettingsContext";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import DashboardScreen from "../../screens/DashboardScreen";
import CustomHeader from "../../components/customHeader";
import ProductScreen from "../../screens/products/product.screen";
import { CategoriesStack } from "../categories/stack";
import { UsersStack } from "../users/stack";

const Tab = createBottomTabNavigator();
export function DashboardTabs() {
    const { isDarkMode } = useSettings();

    const tabBackground = isDarkMode ? "#1e293b" : "#f8fafc";
    const activeTint = isDarkMode ? "#d4af37" : "#0f172a";
    const inactiveTint = isDarkMode ? "#cbd5e1" : "#64748b";

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    const icons: Record<string, string> = {
                        home: "home",
                        categories: "list",
                        products: "pricetags",
                        users: "people",
                        sales: "cart",

                    };
                    return <Ionicons name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: activeTint,
                tabBarInactiveTintColor: inactiveTint,
                tabBarStyle: { backgroundColor: tabBackground, borderTopWidth: 0, height: 60 },
            })}
        >
            <Tab.Screen
                name="home"
                component={DashboardScreen
                }
                initialParams={{ filter: "home" }}
                options={{ header: () => <CustomHeader title="Home" /> }}
            />
            <Tab.Screen
                name="categories"
                component={CategoriesStack}
                initialParams={{ filter: "categories" }}
                options={{ headerShown: false }}
            />
            <Tab.Screen
                name="products"
                component={ProductScreen}
                initialParams={{ filter: "products" }}
                options={{ headerShown: false }}
            />
            <Tab.Screen
                name="users"
                component={UsersStack}
                initialParams={{ filter: "users" }}
                options={{ header: () => <CustomHeader title="Users" /> }}
            />
            <Tab.Screen
                name="sales"
                component={ProductScreen}
                initialParams={{ filter: "sales" }}
                options={{ header: () => <CustomHeader title="Sales" /> }}
            />
        </Tab.Navigator>
    );
}