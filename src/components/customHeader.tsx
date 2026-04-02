import { DrawerActions, NavigationProp, useNavigation } from "@react-navigation/native";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { authStackParamList } from "../../models";
import SearchBar from "./searchBar";
import { useSettings } from "../context/SettingsContext";
import { useEffect, useState } from "react";
import { Initials } from "../../utils/getsalesdata";
import { useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { useTheme } from "../context/themeContext";
import { useConnectivity } from "../context/ConnectivityContext";

// Reusable Badge Component
const NotificationBadge = ({ count, color }: { count: number, color: string }) => {
  if (count <= 0) return null;
  return (
    <View style={[styles.badgeContainer, { backgroundColor: '#EF4444' }]}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

function CustomHeader({ title, add }: { title: string; add?: boolean }) {
  const { isOnline } = useConnectivity();
  const navigation = useNavigation<NavigationProp<authStackParamList>>();
  const { user: { business } } = useSelector((state: any) => state.auth);
  const [dateTime, setDateTime] = useState("");
  const { colors } = useTheme();


  // Mock count - replace with: const notificationCount = useSelector(state => state.notifications.unreadCount);
  const notificationCount = 5;

  useEffect(() => {
    const updateTime = () => setDateTime(new Date().toLocaleString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <View style={{ backgroundColor: colors.primary }} className="flex-row items-center justify-between p-4 shadow-md">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="mr-4">
          <Ionicons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ color: "#ffffff" }} className="text-lg uppercase font-semibold tracking-widest">
          {title}
        </Text>
      </View>

      <View className="flex-row items-center gap-x-4">
        {/* NOTIFICATION ICON WITH BADGE */}
        <View className="items-end">
          <Text style={{ color: "#ffffff" }} className="text-sm font-medium">{dateTime}</Text>
          <Text style={{ color: isOnline ? "#22C55E" : "#c56b22" }} className="text-xs font-semibold mt-1">
            ● {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications" as any)}
          className="relative p-1"
        >
          <Ionicons name="notifications-outline" size={24} color="#ffffff" />
          <NotificationBadge count={notificationCount} color={colors.primary} />
        </TouchableOpacity>


      </View>
    </View>
  );
}

export function CustomHeaderWithSearch({ title, noSearch, nodetail, center }: { title: string; noSearch?: boolean; nodetail?: boolean; center?: boolean }) {
  const navigation = useNavigation<NavigationProp<authStackParamList>>();
  const { isDarkMode } = useSettings();
  const { user: { business } } = useSelector((state: any) => state.auth);
  const [dateTime, setDateTime] = useState("");
  const { isOnline } = useConnectivity();

  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const notificationCount = 3; // Demo count

  useEffect(() => {
    const updateTime = () => setDateTime(new Date().toLocaleString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ backgroundColor: isDarkMode ? "#1e293b" : "#f8fafc" }} className="flex-row justify-between items-center p-4 w-full shadow-2xl">
      <View className="flex-row items-center flex-1">
        {!center && (
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
            <Ionicons name="chevron-back-sharp" size={24} color={textColor} />
          </TouchableOpacity>
        )}
        <Text style={{ color: textColor }} className="text-lg uppercase font-bold tracking-widest mr-4">
          {title}
        </Text>
        {!noSearch && (
          <View className="flex-1 max-w-[200px]">
            <SearchBar placeholder="search" />
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-x-4">
        <TouchableOpacity onPress={() => navigation.navigate("Notifications" as any)} className="relative p-1">
          <Ionicons name="notifications-outline" size={24} color={textColor} />
          <NotificationBadge count={notificationCount} color="red" />
        </TouchableOpacity>

        {!nodetail && (
          <View className="items-end">
            <Text style={{ color: textColor }} className="text-sm font-medium">{dateTime}</Text>
            <Text style={{ color: isOnline ? "#22C55E" : "#c56b22" }} className="text-xs font-semibold">
              ● {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -2,
    top: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff', // White border makes it pop against any background
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default CustomHeader;