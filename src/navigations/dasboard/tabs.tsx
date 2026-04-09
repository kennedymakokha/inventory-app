import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../context/themeContext";

// Screens/Stacks
import DashboardScreen from "../../screens/DashboardScreen";
import ProductScreen from "../../screens/products/product.screen";
import { CategoriesStack } from "../categories/stack";
import { UsersStack } from "../users/stack";
import CustomersScreen from "../../screens/customers/customers.screen";
import CustomHeader from "../../components/customHeader";
import { SubCategoriesStack } from "../subCategory/stack";

const Tab = createBottomTabNavigator();

export function DashboardTabs() {
    const { colors, isDarkMode } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarHideOnKeyboard: true,

                // Active/Inactive Styling
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.subText,

                // Label Styling
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "700",
                    marginBottom: Platform.OS === 'ios' ? 0 : 8,
                },

                // The "Glass" Tab Bar Design
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: isDarkMode ? colors.card : colors.background,
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingTop: 10,
                    // Shadow/Elevation
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: isDarkMode ? 0.3 : 0.05,
                    shadowRadius: 10,
                    elevation: 20,
                },

                tabBarIcon: ({ focused, color, size }) => {
                    const icons: Record<string, string> = {
                        home: focused ? "home" : "home-outline",
                        categories: focused ? "grid" : "grid-outline",
                        sub_categories: focused ? "grid" : "grid-outline",
                        products: focused ? "bag-handle" : "bag-handle-outline",
                        users: focused ? "people" : "people-outline",
                        Customers: focused ? "shield-checkmark" : "shield-outline",
                    };

                    // Add a "Glow" effect to the active icon
                    return (
                        <View style={focused ? [styles.activeIconContainer, { backgroundColor: colors.primary + '15' }] : null}>
                            <Ionicons
                                name={icons[route.name]}
                                size={focused ? 24 : 22}
                                color={focused ? colors.primaryDark : color}
                            />
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen
                name="home"
                component={DashboardScreen}
                initialParams={{ filter: "home" }}
                options={{
                    tabBarLabel: "Dashboard",
                    headerShown: true,
                    header: () => <CustomHeader title="Dashboard" />,

                }}
            />
            <Tab.Screen
                name="categories"
                component={CategoriesStack}
                initialParams={{ filter: "categories" }}
                options={{ tabBarLabel: "Inventory", headerShown: false,}}
            />
            <Tab.Screen
                name="sub_categories"
                component={SubCategoriesStack}
                initialParams={{ filter: "sub_categories" }}
                options={{ tabBarLabel: "Sub_Inventory", headerShown: true, header: () => <CustomHeader title="Sub Categories " /> }}
            />
            <Tab.Screen
                name="products"
                component={ProductScreen}
                initialParams={{ filter: "products" }}
                options={{ tabBarLabel: "Items", headerShown: true, header: () => <CustomHeader title="Items" /> }}
            />
            <Tab.Screen
                name="users"
                component={UsersStack}
                initialParams={{ filter: "users" }}
                options={{
                    tabBarLabel: "Staff",
                    headerShown: true, header: () => <CustomHeader title="Staff Members" />
                }}
            />
            <Tab.Screen
                name="Customers"
                component={CustomersScreen}
                initialParams={{ filter: "customers" }}
                options={{
                    tabBarLabel: "VIP",
                    headerShown: true, header: () => <CustomHeader title="VIP" />
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    activeIconContainer: {
        padding: 6,
        paddingHorizontal: 16,
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
    }
});