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
import { Theme } from "../utils/theme";
import { calculateExpectedCash, closeRegister } from "../services/closeOpen.service";
import { formatNumber } from "../../utils/formatNumbers";

const CustomDrawer: React.FC<DrawerContentComponentProps> = ({
  navigation,
}) => {
  const { logout } = useAuthContext();
  const { user } = useSelector((state: any) => state.auth);

  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const [expected, setExpected] = useState<any>("0");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);




  const logoutUser = async () => {
    await closeRegister(user.role, user._id, 40)
    await logout();

    await AsyncStorage.clear();
  };



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
          <Icon name={icon} size={20} color={theme.text} />
          <Text
            style={{ color: theme.text }}
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
      style={{ backgroundColor: theme.background }}
      className="flex-1 pt-16 px-5"
    >
      {/* Header */}
      <View className="relative items-center mb-10 border-b" style={{ borderBottomColor: theme.border }}>

        {/* Background number */}
        {!showText && <Text
          className="absolute text-[880px] font-bold opacity-20"
          style={{ color: "#38bdf8", bottom: 30, fontSize: 100 }}
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
        <Text style={{ color: theme.text }} className="text-lg">
          Welcome! {user?.name}
        </Text>

      </View>

      {!!message && (
        <Text
          style={{ color: theme.text }}
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
        style={{ borderTopColor: theme.border }}
        className="mt-auto mb-20 border-t pt-5"
      >
        <TouchableOpacity onPress={logoutUser}>
          <Text
            style={{ color: theme.text }}
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