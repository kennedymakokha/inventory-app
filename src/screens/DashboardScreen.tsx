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

const Dashboard = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { colors, isDarkMode } = useTheme();
  const [stats, setStats] = useState({ totalTransactions: 0, totalSales: 0, cashTotal: 0, mpesaTotal: 0, cashCount: 0, mpesaCount: 0 });
  const [showbyCategory, setShowbyCategory] = useState(false);
  const { socket } = useSocket();
  const { business, updateBusiness, isLoading } = useBusiness();
  const [topCategoryProducts, setTopCategoryProducts] = useState([]);
  const [sales, setSales] = useState<any[]>([]);
  const [lowstcks, setlowstcks] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [TopProducts, setTopProducts] = useState([]);
  const [transactions, setTransactions] = useState(0);
  const [datasets, setDatasets] = useState<any[]>([]);

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
    const totalToday: any = await getTodaySales(user.role, user._id);

    const topProducts: any = await getTopProducts(user.user_id, `${user.role === "admin" ? "month" : "today"}`);
    setTopProducts(topProducts);
    const mS = await getMonthlySales(user.role, user._id);
    const todayTx = await getTodayTransactions(user.role, user._id);
    const stcks = await getLowStockProducts();

    setMonthlySales(mS);

    setlowstcks(stcks);
    setSales(totalToday);
    setTransactions(todayTx);
  }, [user]);

  useEffect(() => {
    fetchHourlySales();
    loadDashboard();
    fetchAnalytics()
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: Business) => {
      updateBusiness(data);
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
  const fetchAnalytics = async () => {
    // Ensure you use the correct ID property from your user object
    const id = user.user_id || user._id;

    // Fetch Transaction Count (Quantity of sales)
    const totalTransactions = await getDetailedUserStats(
      id,
      `${user.role === "admin" ? "month" : "today"}`,

    );
    setStats(totalTransactions);
    const productsByCategoryResult: any = await getSalesByCategory(id, `${user.role === "admin" ? "month" : "today"}`);
    setTopCategoryProducts(productsByCategoryResult);
  };
  return (
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
  );
};

export default Dashboard;