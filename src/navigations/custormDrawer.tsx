import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { useAuthContext } from "../context/authContext";
import { useSettings } from "../context/SettingsContext";
import { calculateExpectedCash, closeRegister } from "../services/closeOpen.service";
import { formatNumber } from "../../utils/formatNumbers";
import { useNavigation } from "@react-navigation/native";
import { closeAndDeleteDatabase } from "../services/db-service";
import { useTheme } from "../context/themeContext";

const CustomDrawer: React.FC<DrawerContentComponentProps> = ({
  navigation,
}) => {

  const { logout } = useAuthContext();
  const { user } = useSelector((state: any) => state.auth);

  const handleLogout = async () => {
    await closeRegister(user.role, user._id, 40);
    await logout();
    await AsyncStorage.clear();
    await closeAndDeleteDatabase()
  };
  const { colors } = useTheme();
  const [expected, setExpected] = useState<any>("0");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const menuItem = (
    label: string,
    icon: string,
    screen: string,
    role?: string
  ) => {
    // show if admin OR role matches
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
  useEffect(() => {
    const load = async () => {
      const mS = await calculateExpectedCash(user.role, user._id);
      setExpected(mS);
    };
    load();
    const interval = setInterval(load, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);
  const currentHour = new Date().getHours();
  const showText = currentHour >= 18;
  return (
    <View
      style={{ backgroundColor: colors.primary }}
      className="flex-1 pt-16 px-5"
    >
      {/* Header */}
      <View className="relative items-center mb-10 border-b" style={{ borderBottomColor: colors.border }}>

        {/* Background number */}
        {!showText && <Text
          className="absolute  font-bold  border p-2  rounded-md opacity-20"
          style={{ color: colors.text, top: 0, fontSize: 20, right: 0, borderColor: colors.subText }}
        >
          {formatNumber(expected)}
        </Text>
        }
        {/* Foreground content */}
        <Image
          source={require("../assets/logo.png")}
          className="size-40 rounded-full mb-2"
        />
        <Text
          className="absolute text-[880px] font-bold opacity-20"
          style={{ color: "#38bdf8", bottom: 20, fontSize: 20 }}
        >
          {expected}
        </Text>
        <Text style={{ color: colors.text }} className="text-lg">
          Welcome! {user?.name}
        </Text>

      </View>

      {!!message && (
        <Text
          style={{ color: colors.text }}
          className="text-center mt-2"
        >
          {message}
        </Text>
      )}

      {/* Navigation */}
      {menuItem("Home", "home-outline", "dashboard", "sales")}
      {menuItem("Business", "briefcase-outline", "business", "admin")}
      {menuItem("Products", "swap-horizontal-outline", "products", "admin")}
      {menuItem("Categories", "grid-outline", "categories", "admin")}
      {menuItem("Sales", "cart-outline", "sales", "sales")}
      {menuItem("Reports", "book-outline", "salesreport", "sales")}
      {menuItem("Settings", "settings-outline", "settings", "sales")}
      {menuItem("Profile", "person-outline", "profile", "sales")}

      {/* Sync Button */}


      {/* Footer */}
      <View
        style={{ borderTopColor: colors.border }}
        className="mt-auto mb-20 border-t pt-5"
      >
        <TouchableOpacity onPress={handleLogout}>
          <Text
            style={{ color: colors.text }}
            className="text-center text-2xl font-bold"
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomDrawer;