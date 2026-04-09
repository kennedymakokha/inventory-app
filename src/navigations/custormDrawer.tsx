import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { useAuthContext } from "../context/authContext";
import { calculateExpectedCash, closeRegister } from "../services/closeOpen.service";
import { formatNumber } from "../../utils/formatNumbers";
import { closeAndDeleteDatabase } from "../services/db-service";
import { useTheme } from "../context/themeContext";
import { useBusiness } from "../context/BusinessContext";

const CustomDrawer: React.FC<DrawerContentComponentProps> = ({ navigation }) => {
  const { logout } = useAuthContext();
  const { user } = useSelector((state: any) => state.auth);
  const { business, clearBusiness } = useBusiness();
  const { colors, isDarkMode } = useTheme();

  const [expected, setExpected] = useState<any>("0");
  const isInactive = colors.primary === "#868688";

  const handleLogout = async () => {
    try {
      await closeRegister(user.role, user._id, 40);
      await logout();
      await AsyncStorage.clear();
      await closeAndDeleteDatabase();
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
    const isActive = navigation.getState().routes[navigation.getState().index].name === screen;

    if (user?.role === "admin" || user?.role === role) {
      return (
        <TouchableOpacity
          style={[
            styles.menuItem,
            isActive && { backgroundColor: colors.primary + '15' }
          ]}
          onPress={() => navigation.navigate("Home", { screen })}
        >
          <Icon
            name={icon}
            size={22}
            color={isActive ? colors.primary : colors.text}
            style={{ opacity: isActive ? 1 : 0.7 }}
          />
          <Text
            style={[
              styles.menuText,
              { color: isActive ? colors.primary : colors.text }
            ]}
          >
            {label}
          </Text>
          {isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* --- PREMIUM CURVED HEADER --- */}
      <View style={styles.headerContainer}>
        <View style={[styles.headerBg, { backgroundColor: colors.primary }]} />
        <View style={styles.headerOverlay} />

        {/* Floating Cash Badge */}
        <View style={[styles.glassBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)' }]}>
          <Text style={styles.badgeLabel}>CASH ON HAND</Text>
          <Text style={[styles.badgeValue, { color: isDarkMode ? '#fff' : colors.primary }]}>
            {formatNumber(expected)}
          </Text>
        </View>

        <View style={styles.profileSection}>
          <View style={[styles.logoWrapper, { borderColor: 'rgba(255,255,255,0.3)' }]}>
            <Image
              source={business?.logo ? { uri: business.logo } : require("../assets/logo.png")}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
          <View style={styles.businessBadge}>
            <Text style={styles.businessText}>{business?.business_name || "Your Business"}</Text>
          </View>
        </View>
      </View>

      {/* --- NAVIGATION LINKS --- */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionLabel}>Main Navigation</Text>
        {menuItem("Dashboard", "grid-outline", "dashboard", "sales")}

        {menuItem("Business", "briefcase-outline", "business", "admin")}
        {!isInactive && menuItem("Sales", "cart-outline", "sales", "sales")}
        {menuItem("Reports", "bar-chart-outline", "salesreport", "sales")}
        {menuItem("Deliveries", "bicycle-outline", "Deliveries", "sales")}
        {menuItem("Profile", "person-outline", "profile", "sales")}
        {menuItem("Settings", "settings-outline", "settings", "sales")}
      </View>

      {/* --- FOOTER / LOGOUT --- */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={isInactive ? undefined : handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.primary }]}
        >
          <Icon name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.powerByContainer}>
          <Text style={[styles.powerText, { color: colors.subText }]}>Powered by</Text>
          <Text style={[styles.brandText, { color: colors.primary }]}>
            {isInactive ? "OFF-ZONE" : "MTANDAO LTD"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBg: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    bottom: 0,
    marginHorizontal: 30,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    transform: [{ scaleX: 1.2 }],
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    opacity: 0.15,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  glassBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 0,
    paddingHorizontal: 12,
    marginRight: 20,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  badgeLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 0.5
  },
  badgeValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoWrapper: {
    padding: 4,
    borderRadius: 50,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  welcomeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
  businessBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 5,
  },
  businessText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 30,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 5,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 15,
    letterSpacing: 0.5,
  },
  activeIndicator: {
    position: 'absolute',
    right: 15,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 10,
  },
  powerByContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  powerText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  brandText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2,
  },
});

export default CustomDrawer;