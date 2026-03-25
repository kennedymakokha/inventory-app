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

  useEffect(() => {

    if (!socket) return;

    const handleNotification = async (data: Business) => {
      await updateBusiness(data);
      await AsyncStorage.setItem("primary_color", data.primary_color ?? "#3c58a8");
      await AsyncStorage.setItem("secondary_color", data.secondary_color ?? "#fff");
      await refreshTheme();
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

 

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