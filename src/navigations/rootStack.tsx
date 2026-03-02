import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { authStackParamList, ReportParamList } from "../../models";
import LoginScreen from "../screens/Logincreen";
import { useAuthContext } from "../context/authContext";
import ProductScreen from "../screens/products/product.screen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomHeader, { CustomHeaderWithSearch } from "../components/customHeader";
import Ionicons from 'react-native-vector-icons/Ionicons'
import DashboardScreen from "../screens/DashboardScreen";
import InventoryScreen from "../screens/inventory/inventory.screen";
import SearchBar from "../components/searchBar";
import { View } from "react-native";
import SalesScreen from "../screens/sales/salesScreen";
import SalesReport from "../screens/reports/sales";
import InventoryDetails from "../screens/inventory/inventoryDetails";
import CategoryScreen from "../screens/categories/categories.screen";
import SettingsScreen from "../screens/settingsScreen";

const Stack = createNativeStackNavigator<authStackParamList>();

const ReporStack = createNativeStackNavigator<ReportParamList>();
const Tab = createBottomTabNavigator();

function ProductsTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === 'AllProducts') {
          iconName = 'list';
        } else if (route.name === 'SyncedProducts') {
          iconName = 'cloud-done';
        } else if (route.name === 'UnsyncedProducts') {
          iconName = 'cloud-offline';
        }

        return <Ionicons name={`${iconName}`} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#d4af37',      // Active icon/text color
      tabBarInactiveTintColor: '#cbd5e1',       // Inactive icon/text color
      tabBarStyle: {
        backgroundColor: '#1e293b',          // Background color of the tab bar
        borderTopWidth: 0,                   // Optional: remove top border
        height: 60,                          // Optional: adjust height
      },
    })}>
      <Tab.Screen
        name="AllProducts"
        options={{
          title: "All",
          header: () => <CustomHeader title="All products" />
        }}
        component={ProductScreen}
        initialParams={{ filter: 'all' }}
      />
      <Tab.Screen
        name="SyncedProducts"
        options={{
          title: "Synced",
          header: () => <CustomHeader title="Synced products" />
        }}
        component={ProductScreen}
        initialParams={{ filter: 'synced' }}
      />
      <Tab.Screen
        name="UnsyncedProducts"
        options={{
          title: "Unsynced",
          header: () => <CustomHeader title="Unsynced products" />
        }}
        component={ProductScreen}
        initialParams={{ filter: 'unsynced' }}
      />
    </Tab.Navigator>
  );
}
export function RootStack() {

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0f172a', // change this to your desired color
        },
        headerTintColor: '#d4af37', // optional: change back button and title color
        headerTitleStyle: {
          fontWeight: 'bold',

        },
      }}
    >
      <Stack.Screen name="dashboard" options={{
        header: () => <CustomHeader title="Dashboard" />
      }} component={DashboardScreen} />
      <Stack.Screen name="products"
        options={{
          title: "",
          header: () => <CustomHeaderWithSearch noSearch title="Products" />
        }}
        component={ProductScreen} />
      <Stack.Screen name="inventory" options={{
        headerShown: false
      }} component={InventoryStack} />
      <Stack.Screen name="categories" options={{
        headerShown: false
      }} component={CategoriesStack} />
      <Stack.Screen name="sales" options={{
        title: "",
        header: () => <CustomHeaderWithSearch noSearch title="Sales" />
      }} component={SalesScreen} />
      <Stack.Screen name="salesreport" options={{
        title: "",
        header: () => <CustomHeaderWithSearch noSearch title="Sales Report" />
      }} component={ReportStack} />
      <Stack.Screen name="settings" options={{
        title: "",
        header: () => <CustomHeaderWithSearch noSearch title="Settings" />
      }} component={SettingsScreen} />

    </Stack.Navigator>
  );
}

export function ReportStack() {

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0f172a', // change this to your desired color
        },
        headerTintColor: '#d4af37', // optional: change back button and title color
        headerTitleStyle: {
          fontWeight: 'bold',

        },
      }}
    >
      <ReporStack.Screen name="salesReport" options={{ headerShown: false }} component={SalesReport} />
    

    </Stack.Navigator>
  );
}
export function InventoryStack() {

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>

      <Stack.Screen name="inventory_Dashboard"
        options={{
          title: "",
          header: () => <CustomHeaderWithSearch noSearch title="Inventory" />
        }}
        component={InventoryScreen} />
      <Stack.Screen name="inventory_Details" component={InventoryDetails}
        options={({ route }: any) => {
          console.log(route)
          return {
            // title: route.params.product.product_name,
            header: () => <CustomHeaderWithSearch noSearch title={`${route.params.product.product_name}`} />
          }
        }}
      />

    </Stack.Navigator>
  );
}
export function CategoriesStack() {

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>

      <Stack.Screen name="categories_Dashboard"
        options={{
          title: "",
          header: () => <CustomHeaderWithSearch noSearch title="Categories" />
        }}
        component={CategoryScreen} />


    </Stack.Navigator>
  );
}
export function AuthStack() {

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="login" component={LoginScreen} />

    </Stack.Navigator>
  );
}



