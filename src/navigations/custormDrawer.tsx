import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { useAuthContext } from "../context/authContext";
import { calculateExpectedCash, closeRegister } from "../services/closeOpen.service";
import { formatNumber } from "../../utils/formatNumbers";
import { closeAndDeleteDatabase } from "../services/db-service";
import { useTheme } from "../context/themeContext";
import { useBusiness } from "../context/BusinessContext";
import { useFocusEffect } from "@react-navigation/native";


const CustomDrawer: React.FC<DrawerContentComponentProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { logout } = useAuthContext();
  const { user } = useSelector((state: any) => state.auth);
  const { business, clearBusiness } = useBusiness();
  const { colors } = useTheme();

  // Component State
  const [expected, setExpected] = useState<any>("0");
  const isInactive = colors.primary === "#868688";

  const handleLogout = async () => {
    try {
      await closeRegister(user.role, user._id, 40);
      await logout();
      await AsyncStorage.clear();
      await closeAndDeleteDatabase();

      // Clear Business Context and the API Cache
      clearBusiness();


    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const load = async () => {
      const mS = await calculateExpectedCash(user.role, user.user_id);
      setExpected(mS);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [user]);
 
  const menuItem = (label: string, icon: string, screen: string, role?: string) => {
    if (user?.role === "admin" || user?.role === role) {
      return (
        <TouchableOpacity
          className="flex-row items-center my-4"
          onPress={() => navigation.navigate("Home", { screen })}
        >
          <Icon name={icon} size={20} color={colors.text} />
          <Text
            style={{ color: colors.text }}
            className="tracking-widest uppercase text-base ml-3"
          >
            {label}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const currentHour = new Date().getHours();
  const showText = currentHour >= 18;

  return (
    <View
      style={{
        backgroundColor: colors.background,
        opacity: isInactive ? 0.8 : 1 // Subtly dim the whole drawer
      }}
      className="flex-1  ">
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        {/* Background */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: -0,
            right: -0,
            height: 240,
            backgroundColor: colors.primary,
            paddingHorizontal: 5,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          }}
        />

        {/* Overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: -0,
            right: -0,
            height: 240,
            backgroundColor: "#000",
            opacity: 0.2,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          }}
        />

        {/* Content INSIDE header */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 60, // 🔥 pushes content nicely inside header
            paddingBottom: 20,
          }}
        >
          {/* Cash Badge */}
          <View
            style={{
              position: "absolute",
              top: 50,
              right: 10,
              backgroundColor: "#fff",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              elevation: 6,
            }}
          >
            <Text style={{ color: "#000", fontWeight: "bold" }}>
              {formatNumber(expected)}
            </Text>
          </View>

          {/* Logo */}
          <View
            style={{
              padding: 4,
              borderRadius: 100,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <Image
              source={
                business?.logo
                  ? { uri: business.logo }
                  : require("../assets/logo.png")
              }
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
              }}
            />
          </View>

          {/* Greeting */}
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "600",
              marginTop: 10,
            }}
          >
            Welcome, {user?.name}
          </Text>

          {/* Business Name */}
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
              marginTop: 2,
            }}
          >
            {business?.business_name || "Your Business"}
          </Text>
        </View>
      </View>


      <View className="px-5">
        {/* Navigation Links */}
        {menuItem("Home", "home-outline", "dashboard", "sales")}
        {menuItem("Business", "briefcase-outline", "business", "admin")}
        {!isInactive && menuItem("Sales", "cart-outline", "sales", "sales")}
        {menuItem("Reports", "book-outline", "salesreport", "sales")}
        {menuItem("Settings", "settings-outline", "settings", "sales")}
        {menuItem("Profile", "person-outline", "profile", "sales")}
      </View>
      {/* Footer / Logout */}

      <View style={{ marginTop: 'auto' }}>
        {/* Top border separator */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            opacity: 0.5,
            marginBottom: 10,
          }}
        />

        {/* Footer container */}
        <View
          style={{
            paddingVertical: 15,
            paddingHorizontal: 10,
            borderRadius: 4,
            backgroundColor: colors.card || "rgba(0,0,0,0.05)",
            alignItems: "center",
          }}
        >
          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 10,
              paddingHorizontal: 30,
              borderRadius: 10,
              marginBottom: 10,
              elevation: 4,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>

          {/* Powered by */}
          <Text
            style={{
              color: colors.text,
              fontSize: 11,
              opacity: 0.6,
            }}
          >
            Powered by
          </Text>

          <Text
            style={{
              color: colors.primary,
              fontSize: 13,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            {isInactive ? "SHOP CLOSED / OUT OF ZONE" : "Mtandao LTD"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CustomDrawer;