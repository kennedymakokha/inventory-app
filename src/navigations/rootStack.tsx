import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { authStackParamList } from "../../models";
import LoginScreen from "../screens/Logincreen";
import { useAuthContext } from "../context/authContext";
import ProductScreen from "../screens/products/product.screen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomHeader from "../components/customHeader";
import Ionicons from 'react-native-vector-icons/Ionicons'
import DashboardScreen from "../screens/DashboardScreen";
import InventoryScreen from "../screens/inventory/inventory.screen";
import SearchBar from "../components/searchBar";
import { View } from "react-native";

const Stack = createNativeStackNavigator<authStackParamList>();


const Tab = createBottomTabNavigator();

function ProductsTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
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
      <Stack.Screen name="products"  component={ProductsTabs} />
      <Stack.Screen name="inventory" options={{
        title: "My Inventory",
        headerRight: () => (
          <SearchBar placeholder="search" />
        ),
      }} component={InventoryScreen} />

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



