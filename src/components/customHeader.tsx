import { DrawerActions, NavigationProp, useNavigation } from "@react-navigation/native";
import { Text, View, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { authStackParamList } from "../../models";
import SearchBar from "./searchBar";
import { useSettings } from "../context/SettingsContext";
import { useEffect, useState } from "react";
import { Initials } from "../../utils/getsalesdata";
import { useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";

function CustomHeader({ title, add }: { title: string; add?: boolean }) {
  const navigation = useNavigation<NavigationProp<authStackParamList>>();
  const { isDarkMode } = useSettings();
  const { user: { business } } = useSelector((state: any) => state.auth);
  const [dateTime, setDateTime] = useState("");
  const [online, setOnline] = useState(true);
  const bgColor = isDarkMode ? "#1e293b" : "#f8fafc";
  const primaryColor = isDarkMode ? "#d4af37" : "#0f172a";
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const onlineColor = "#22C55E"; // keep online green
  const offlineColor = "#c56b22";
  useEffect(() => {
    const updateTime = () => setDateTime(new Date().toLocaleString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setOnline(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);
  return (
    <View
      style={{ backgroundColor: bgColor }}
      className="flex-row items-center justify-between p-4 shadow-md"
    >
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          className="mr-4"
        >
          <Ionicons name="menu" size={24} color={primaryColor} />
        </TouchableOpacity>
        <View className="flex-row items-center justify-between">
          <Text
            style={{ color: textColor }}
            className="text-lg uppercase font-semibold tracking-widest"
          >
            {title}
          </Text>
        </View>
      </View>
      {/* 
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        className="mr-4"
      >
        <Ionicons name="cart-sharp" size={24} color={primaryColor} />
      </TouchableOpacity> */}
      <View className="items-end">
        <Text style={{ color: textColor }} className="text-sm font-medium">{dateTime}</Text>
        <Text style={{ color: online ? onlineColor : offlineColor }} className="text-xs font-semibold mt-1">
          ● {online ? "Online" : "Offline"} | Terminal: {Initials(business.business_name)}-POS-01
        </Text>
      </View>
    </View>
  );
}

export function CustomHeaderWithSearch({
  title,
  noSearch,
}: {
  title: string;
  noSearch?: boolean;
}) {
  const navigation = useNavigation<NavigationProp<authStackParamList>>();
  const { isDarkMode } = useSettings();
  const { user: { business } } = useSelector((state: any) => state.auth);
  const [dateTime, setDateTime] = useState("");
  const [online, setOnline] = useState(true);
  const onlineColor = "#22C55E"; // keep online green
  const offlineColor = "#c56b22";
  const bgColor = isDarkMode ? "#1e293b" : "#f8fafc";
  const primaryColor = isDarkMode ? "#d4af37" : "#0f172a";
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  useEffect(() => {
    const updateTime = () => setDateTime(new Date().toLocaleString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setOnline(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);
  return (
    <View
      style={{ backgroundColor: bgColor }}
      className="flex-row justify-between items-center gap-x-2 p-4 w-full shadow-2xl"
    >
      <View className="flex-row items-center ">
        <TouchableOpacity  onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-sharp" size={24} color={primaryColor} />
        </TouchableOpacity>
        <View className="flex-row items-center justify-between">
          <Text
            style={{ color: textColor }}
            className="text-lg uppercase font-bold tracking-widest"
          >
            {title}
          </Text>
        </View>
        {!noSearch && (
          <View className="flex-row items-center justify-between w-1/2">
            <SearchBar placeholder="search" />
          </View>
        )}
      </View>
      <View className="items-end">
        <Text style={{ color: textColor }} className="text-sm font-medium">{dateTime}</Text>
        <Text style={{ color: online ? onlineColor : offlineColor }} className="text-xs font-semibold mt-1">
          ● {online ? "Online" : "Offline"} | Terminal: {Initials(business.business_name)}-POS-01
        </Text>
      </View>
    </View>
  );
}

export default CustomHeader;