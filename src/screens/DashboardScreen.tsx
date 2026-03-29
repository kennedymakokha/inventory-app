import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform
} from "react-native";
import { useSelector } from "react-redux";
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";

// Custom Components
import PageHeader from "../components/pageHeader";
import StartCard from "../components/startCard";
import DataGraph from "./dashbordItems/DataGraph";
import PieChart from "./dashbordItems/PieChart";
import MultiLineChart from "./dashbordItems/lineGraph";
import RadialFab from "../components/multiFab";

// Context & Services
import { useTheme } from "../context/themeContext";
import { useSocket } from "../context/socketContext";
import { useBusiness } from "../context/BusinessContext";
import { useAppStatus } from "../hooks/useAppStatus";
import {
  getDetailedUserStats,
  getHourlySalesByProduct,
  getLowStockProducts,
  getMonthlySales,
  getSalesByCategory,
  getTopProducts,
  SalesFilter,
} from "../services/analytics.service";

const Dashboard = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { colors, isDarkMode, applyThemeDirectly, refreshTheme } = useTheme();
  const { socket } = useSocket();
  const { business, updateBusiness } = useBusiness();
  const { Kiosk } = NativeModules;

  // States
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalTransactions: 0, totalSales: 0, cashTotal: 0, mpesaTotal: 0, cashCount: 0, mpesaCount: 0 });
  const [showbyCategory, setShowbyCategory] = useState(false);
  const [topCategoryProducts, setTopCategoryProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStocks, setLowStocks] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { evaluateStatus } = useAppStatus({ user, business, refreshTheme });

  // Hourly range logic
  const [startHour, endHour] = useMemo(() => {
    if (business?.working_hrs) {
      const parts = business.working_hrs.split("-");
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (!isNaN(start) && !isNaN(end)) return [start, end];
    }
    return [8, 17];
  }, [business]);

  const fetchAnalytics = useCallback(async (filter: SalesFilter, customDate?: string) => {
    const id = user.role !== "admin" ? user.user_id || user._id : "";
    try {
      const [totalStats, tProducts, tCategories]: any = await Promise.all([
        getDetailedUserStats(id, filter, customDate),
        getTopProducts(id, filter, customDate),
        getSalesByCategory(id, filter, customDate)
      ]);
      setStats(totalStats);
      setTopProducts(tProducts);
      setTopCategoryProducts(tCategories);
    } catch (err) {
      console.error("Analytics Error:", err);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    const filter = user.role === "admin" ? "month" : "today";
    try {
      const [hourly, monthly, stocks] = await Promise.all([
        getHourlySalesByProduct(user.role, user.user_id || user._id),
        getMonthlySales(user.role, user._id),
        getLowStockProducts()
      ]);
      setDatasets(hourly);
      setMonthlySales(monthly);
      setLowStocks(stocks);
      await fetchAnalytics(filter);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setRefreshing(false);
    }
  }, [user, fetchAnalytics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Socket Logic
  useEffect(() => {
    if (!socket) return;
    socket.emit("registerDevice", user._id);

    socket.on("business:update", async (data: any) => {
      await updateBusiness(data);
      if (data.primary_color || data.secondary_color) {
        applyThemeDirectly(data.primary_color || "#3c58a8", data.secondary_color || "#ffffff");
      }
      await evaluateStatus();
    });

    socket.on("force:lock", async () => {
      await AsyncStorage.setItem("inactive", "true");
      await evaluateStatus();
    });

    socket.on("sales:new", loadData);

    return () => {
      socket.off("business:update");
      socket.off("force:lock");
      socket.off("sales:new");
    };
  }, [socket, updateBusiness, evaluateStatus, loadData, applyThemeDirectly]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />}
      >
        {/* INVENTORY ALERTS */}
        {lowStocks.length > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={18} color={colors.danger} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Low Stock Alerts</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {lowStocks.map((item, i) => (
                <View key={i} style={[styles.stockBadge, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}>
                  <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>{item.product_name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* SUMMARY CARDS */}
        <View style={{ marginTop: 10 }}>
          <StartCard {...stats} />
        </View>

        <View style={styles.contentPadding}>

          {/* TOP PERFORMERS CHART */}
          <View style={[styles.card, {  borderColor: colors.border }]}>
            <DataGraph
              pressed={() => setShowbyCategory(!showbyCategory)}
              title={`Top ${showbyCategory ? "Categories" : "Products"}`}
              data={showbyCategory ? topCategoryProducts : topProducts}
            />
          </View>

          {/* HOURLY SALES TREND */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MultiLineChart
              startHour={startHour}
              endHour={endHour}
              title="Hourly Sales Trend"
              datasets={datasets || []}
            />
          </View>

          {/* MONTHLY PIE CHART */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PieChart title="Monthly Sales Distribution" data={monthlySales} />
          </View>

          {/* KIOSK CONTROLS */}
          {/* <View style={styles.kioskRow}>
            <TouchableOpacity
              onPress={() => Kiosk.lock()}
              style={[styles.kioskBtn, { backgroundColor: colors.danger + '20' }]}
            >
              <Ionicons name="lock-closed" size={20} color={colors.danger} />
              <Text style={{ color: colors.danger, fontWeight: '700' }}>Lock Kiosk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Kiosk.unlock()}
              style={[styles.kioskBtn, { backgroundColor: '#22c55e20' }]}
            >
              <Ionicons name="lock-open" size={20} color="#22c55e" />
              <Text style={{ color: '#22c55e', fontWeight: '700' }}>Unlock Kiosk</Text>
            </TouchableOpacity>
          </View> */}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING ACTION MENU */}
      <RadialFab
        mainColor={colors.primary}
        mainIcon="filter-outline"
        radius={120}
        angle={90}
        actions={[
          { icon: 'today-outline', label: 'Today', onPress: () => fetchAnalytics('today') },
          { icon: 'calendar-outline', label: 'Week', onPress: () => fetchAnalytics('week') },
          { icon: 'stats-chart-outline', label: 'Month', onPress: () => fetchAnalytics('month') },
          { icon: 'bar-chart-outline', label: 'Year', onPress: () => fetchAnalytics('year') },
          { icon: 'time-outline', label: 'Date', onPress: () => setShowDatePicker(true) },
        ]}
      />

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          themeVariant={isDarkMode ? "dark" : "light"}
          onChange={async (event, date) => {
            setShowDatePicker(false);
            if (date) {
              const formattedDate = date.toISOString().split('T')[0];
              await fetchAnalytics('custom', formattedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contentPadding: {
    padding: 16,
    gap: 20
  },
  alertSection: {
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  card: {
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { }
    })
  },
  kioskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20
  },
  kioskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8
  }
});

export default Dashboard;