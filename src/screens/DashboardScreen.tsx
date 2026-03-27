import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { useSettings } from "../context/SettingsContext";
import { Theme } from "../utils/theme";
import PageHeader from "../components/pageHeader";
import {
  getDetailedUserStats,
  getHourlySalesByProduct,
  getLowStockProducts,
  getMonthlySales,
  getSalesByCategory,
  getTodaySales,
  getTodayTransactions,
  getTopProducts,
  SalesFilter,
} from "../services/analytics.service";

import DataGraph from "./dashbordItems/DataGraph";
import PieChart from "./dashbordItems/PieChart";
import MultiLineChart from "./dashbordItems/lineGraph";
import Icon from 'react-native-vector-icons/FontAwesome'
import { formatNumber } from "../../utils/formatNumbers";
import { useSocket } from "../context/socketContext";
import { Business, useBusiness } from "../context/BusinessContext";
import { useTheme } from "../context/themeContext";
import StartCard from "../components/startCard";
import RadialFab from "../components/multiFab";

import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clockIn, clockOut } from "../services/users.service";
import { NativeModules } from "react-native";
import { TouchableOpacity } from "react-native";
import { useAppStatus } from "../hooks/useAppStatus";

const Dashboard = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { colors, isDarkMode } = useTheme();
  const [stats, setStats] = useState({ totalTransactions: 0, totalSales: 0, cashTotal: 0, mpesaTotal: 0, cashCount: 0, mpesaCount: 0 });
  const [showbyCategory, setShowbyCategory] = useState(false);
  const { socket } = useSocket();
  const { business, updateBusiness, isLoading } = useBusiness();
  const [topCategoryProducts, setTopCategoryProducts] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lowstcks, setlowstcks] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [TopProducts, setTopProducts] = useState([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const { refreshTheme } = useTheme();
  const { Kiosk } = NativeModules;

  const {
    isWithinZones,
    setIsWithinZones,
    shouldLock,
    evaluateStatus
  } = useAppStatus({ user, business, refreshTheme });
  const fetchHourlySales = async () => {
    try {
      const productDatasets = await getHourlySalesByProduct(
        user.role,
        user.user_id
      );
      setDatasets(productDatasets);
    } catch (error) {
      console.error("Error fetching hourly sales:", error);
    }
  };

  const loadDashboard = useCallback(async () => {


    const mS = await getMonthlySales(user.role, user._id);

    const stcks = await getLowStockProducts();

    setMonthlySales(mS);

    setlowstcks(stcks);


  }, [user]);

  useEffect(() => {
    const filter = user.role === "admin" ? "month" : "today"
    fetchHourlySales();
    loadDashboard();
    fetchAnalytics(filter)
  }, []);



  // inside your component
  const { applyThemeDirectly } = useTheme();
  // const { evaluateStatus } = useAppStatus({ user, business, refreshTheme });

  useEffect(() => {
    if (!socket) return;
    socket.emit("registerDevice", user._id);
    /* ---------------- BUSINESS UPDATE ---------------- */
    const handleBusinessUpdate = async (data: any) => {
      try {
        console.log("📡 Business update received:", data);

        // 1. Update business (source of truth)
        await updateBusiness(data);

        // 2. ⚡ INSTANT UI UPDATE (no AsyncStorage delay)
        if (data.primary_color || data.secondary_color) {
          applyThemeDirectly(
            data.primary_color || "#3c58a8",
            data.secondary_color || "#ffffff"
          );
        }

        // 3. 🔥 Re-evaluate app state (lock, clock, etc.)
        await evaluateStatus();

      } catch (err) {
        console.error("❌ Socket business update error:", err);
      }
    };

    /* ---------------- FORCE LOCK ---------------- */
    const handleForceLock = async () => {
      console.log("🔒 Server forced lock");

      await AsyncStorage.setItem("inactive", "true");

      await evaluateStatus(); // engine handles lock
    };

    /* ---------------- FORCE UNLOCK ---------------- */
    const handleForceUnlock = async () => {
      console.log("🔓 Server forced unlock");

      await AsyncStorage.setItem("inactive", "false");

      await evaluateStatus();
    };

    /* ---------------- GEOFENCE OVERRIDE ---------------- */
    const handleGeofenceOverride = async (inside: boolean) => {
      console.log("📍 Server geofence override:", inside);

      await AsyncStorage.setItem("lastZoneState", inside ? "true" : "false");

      await evaluateStatus(inside);
    };

    /* ---------------- OPTIONAL: LIVE DASHBOARD REFRESH ---------------- */
    const handleNewSale = async () => {
      console.log("💰 New sale → refreshing dashboard");

      const filter = user.role === "admin" ? "month" : "today";

      await fetchHourlySales();
      await loadDashboard();
      await fetchAnalytics(filter);
    };

    /* ---------------- ATTACH EVENTS ---------------- */
    socket.on("business:update", handleBusinessUpdate);
    socket.on("force:lock", handleForceLock);
    socket.on("force:unlock", handleForceUnlock);
    socket.on("geofence:update", handleGeofenceOverride);
    socket.on("sales:new", handleNewSale);

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Socket disconnected");
    });

    /* ---------------- CLEANUP ---------------- */
    return () => {
      socket.off("business:update", handleBusinessUpdate);
      socket.off("force:lock", handleForceLock);
      socket.off("force:unlock", handleForceUnlock);
      socket.off("geofence:update", handleGeofenceOverride);
      socket.off("sales:new", handleNewSale);
      socket.off("connect");
      socket.off("disconnect");
    };

  }, [socket, updateBusiness, evaluateStatus]);
  const [startHour, endHour] = (() => {
    if (business?.working_hrs) {
      // Example format: "8-17"
      const parts = business.working_hrs.split("-");
      if (parts.length === 2) {
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (!isNaN(start) && !isNaN(end)) {
          return [start, end];
        }
      }
    }
    return [8, 17]; // default
  })();


  const fetchAnalytics = async (filter: SalesFilter, customDate?: string) => {
    // Ensure you use the correct ID property from your user object
    const id = user.role !== "admin" ? user.user_id || user._id : "";

    // Fetch Transaction Count (Quantity of sales)
    const totalTransactions = await getDetailedUserStats(
      id,
      filter,
      customDate,

    );
    const topProducts: any = await getTopProducts(id, filter, customDate,);
    setTopProducts(topProducts);
    setStats(totalTransactions);
    const productsByCategoryResult: any = await getSalesByCategory(id, filter, customDate,);
    setTopCategoryProducts(productsByCategoryResult);
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>

        {lowstcks.length > 0 && (
          <PageHeader
            component={() => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 6 }}>
                  {lowstcks.map((item, i) => (
                    <View style={{ backgroundColor: colors.danger }} className="px-3 py-1 rounded-sm" key={i}>
                      <Text style={{ color: colors.text }}>{item.product_name}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          />
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <StartCard {...stats} />
        </ScrollView>

        <DataGraph pressed={() => setShowbyCategory(!showbyCategory)} title={`Top Performing ${showbyCategory ? "Categories" : "Products"}`} data={showbyCategory ? topCategoryProducts ?? topCategoryProducts : TopProducts ?? TopProducts} />


        <MultiLineChart startHour={startHour} // optional business start hour
          endHour={endHour} title="Hourly Sales" datasets={datasets || []} />

        <PieChart title="Monthly sales" data={monthlySales} />
        <View className="flex px-10 py-3 flex-row justify-between w-full ">
          <TouchableOpacity onPress={() => Kiosk.lock()}>
            <Text className="text-white">LOCK APP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Kiosk.unlock()}>
            <Text className="text-white">UN LOCK APP</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <RadialFab
        mainColor={colors.primary}
        mainIcon="menu"
        radius={120}
        angle={90}
        actions={[
          { icon: 'today-outline', label: 'T', onPress: () => fetchAnalytics('today') },
          { icon: 'calendar-outline', label: 'W', onPress: () => fetchAnalytics('week') },
          { icon: 'stats-chart-outline', label: 'M', onPress: () => fetchAnalytics('month') },
          { icon: 'bar-chart-outline', label: 'Y', onPress: () => fetchAnalytics('year') },
          { icon: 'person-outline', label: 'C', onPress: () => setShowDatePicker(true) },
        ]}
      />
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          themeVariant={isDarkMode ? "dark" : "light"}
          onChange={async (event, date) => {
            if (event.type === 'dismissed') {
              setShowDatePicker(false);
              return;
            }

            if (date) {
              const formattedDate = date.toISOString().split('T')[0];

              await fetchAnalytics('custom', formattedDate);
              setShowDatePicker(false);
            }
          }}
        />
      )}
    </View>

  );
};

export default Dashboard;