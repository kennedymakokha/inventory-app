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
import { calculateExpectedCash } from "../services/closeOpen.service";

const CustomDrawer: React.FC<DrawerContentComponentProps> = ({
  navigation,
}) => {
  const { logout } = useAuthContext();
  const { user } = useSelector((state: any) => state.auth);

  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const [expected, setExpected] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);




  const logoutUser = async () => {
    await logout();
    await AsyncStorage.clear();
  };



  const menuItem = (
    label: string,
    icon: string,
    screen: string
  ) => (
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
  useEffect(() => {
    const load = async () => {
      const mS = await calculateExpectedCash();
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
          {expected}
        </Text>
        }
        {/* Foreground content */}
        <Image
          source={require("../assets/logo.png")}
          className="size-40 rounded-full mb-2"
        />

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
      {menuItem("Home", "home-outline", "dashboard")}
      {menuItem("Products", "swap-horizontal-outline", "products")}
      {menuItem("Categories", "grid-outline", "categories")}
      {menuItem("Sales", "cart-outline", "sales")}
      {menuItem("Reports", "book-outline", "salesreport")}
      {menuItem("Settings", "settings-outline", "settings")}

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