import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import SearchBar from "./searchBar";
import { useSettings } from "../context/SettingsContext";
import NetInfo from "@react-native-community/netinfo";
import { Initials } from "../../utils/getsalesdata";
import { useTheme } from "../context/themeContext";

const POSHeader = ({ component, title }: { component?: () => React.ReactNode, title?: string }) => {
  const { user } = useSelector((state: any) => state.auth);
  const [dateTime, setDateTime] = useState("");
  const [online, setOnline] = useState(true);
  const { business } = user;

  const { colors, isDarkMode } = useTheme();
  // Dynamic colors
  const bgColor = isDarkMode ? "#1e293b" : "#f8fafc";

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
    <View style={{ backgroundColor: colors.background }} className="px-5 pt-0 pb-0 shadow-lg">
    
      <View className="mt-0">
        {component ? component() : <SearchBar white={isDarkMode} placeholder={`Search ${title ? title : ""}...`} />}
      </View>
    </View>
  );
};

export default POSHeader;