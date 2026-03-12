import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SearchBar from "./searchBar";
import { useSettings } from "../context/SettingsContext";
import NetInfo from "@react-native-community/netinfo";
import { Initials } from "../../utils/getsalesdata";

const POSHeader = ({ component, title }: { component?: () => React.ReactNode, title?: string }) => {
  const { user } = useSelector((state: any) => state.auth);
  const [dateTime, setDateTime] = useState("");
  const [online, setOnline] = useState(true);
  const { business } = user;
  const { isDarkMode } = useSettings();

  // Dynamic colors
  const bgColor = isDarkMode ? "#1e293b" : "#f8fafc";
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const badgeBg = isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
  const onlineColor = "#22C55E"; // keep online green
  const offlineColor = "#c56b22";
  useEffect(() => {
    const updateTime = () => setDateTime(new Date().toLocaleString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOnline(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ backgroundColor: bgColor }} className="px-5 pt-0 pb-0 shadow-lg">
      {/* Business Name */}
      {/* <Text style={{ color: textColor }} className="text-2xl text-center font-extrabold tracking-wide">
        {business.business_name}
      </Text> */}

      {/* User + Terminal Info */}
      {/* <View className="flex-row justify-between items-center mt-3">
        Cashier Info
        <View>
          <Text style={{ color: textColor }} className="text-lg font-semibold">{user?.name}</Text>

        </View>
        <View style={{ backgroundColor: badgeBg }} className="px-3 py-1 rounded-sm mt-1 self-start">
          <Text style={{ color: textColor }} className="text-xs font-bold uppercase tracking-wide">
            {user?.role}
          </Text>
        </View>
        Terminal & Online Status
        <View className="items-end">
          <Text style={{ color: textColor }} className="text-sm font-medium">{dateTime}</Text>
          <Text style={{ color: online ? onlineColor : offlineColor }} className="text-xs font-semibold mt-1">
            ● {online ? "Online" : "Offline"} | Terminal: `{Initials(business.business_name)}-POS-01`
          </Text>
        </View>
      </View> */}

      {/* Search / Custom Component */}
      <View className="mt-0">
        {component ? component() : <SearchBar white={isDarkMode} placeholder={`Search ${title ? title : ""}...`} />}
      </View>
    </View>
  );
};

export default POSHeader;