import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { useSettings } from "../context/SettingsContext";
import { Theme } from "../utils/theme";
import PageHeader from "../components/pageHeader";
import {
  getHourlySalesByProduct,
  getLowStockProducts,
  getMonthlySales,
  getTodaySales,
  getTodayTransactions,
  getTopProducts,
} from "../services/analytics.service";

import DataGraph from "./dashbordItems/DataGraph";
import PieChart from "./dashbordItems/PieChart";
import MultiLineChart from "./dashbordItems/lineGraph";

import { formatNumber } from "../../utils/formatNumbers";
import { useSocket } from "../context/socketContext";
import { useBusiness } from "../context/BusinessContext";

const Dashboard = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const { socket } = useSocket();
  const { updateBusiness } = useBusiness();

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
        user._id
      );
      setDatasets(productDatasets);
    } catch (error) {
      console.error("Error fetching hourly sales:", error);
    }
  };

  const loadDashboard = useCallback(async () => {
    const totalToday: any = await getTodaySales(user.role, user._id);
    const tp: any = await getTopProducts(user.role, user._id);
    const mS = await getMonthlySales(user.role, user._id);
    const todayTx = await getTodayTransactions(user.role, user._id);
    const stcks = await getLowStockProducts();

    setMonthlySales(mS);
    setTopProducts(tp);
    setlowstcks(stcks);
    setSales(totalToday);
    setTransactions(todayTx);
  }, [user]);

  useEffect(() => {
    fetchHourlySales();
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: any) => {
      updateBusiness({
                ...data, headers: {
                    "x-source": "socket"
                }
            });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      
      {lowstcks.length > 0 && (
        <PageHeader
          component={() => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {lowstcks.map((item, i) => (
                  <View key={i}>
                    <Text>{item.product_name}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        />
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          
          <View>
            <Text>Total Sales</Text>
            <Text>{formatNumber(sales) || 0}</Text>
          </View>

          <View>
            <Text>Transactions</Text>
            <Text>{transactions || 0}</Text>
          </View>

        </View>
      </ScrollView>

      <DataGraph title="Top Performing Products" data={TopProducts} />

      <MultiLineChart title="Hourly Sales" datasets={datasets || []} />

      <PieChart title="Monthly sales" data={monthlySales} />

    </ScrollView>
  );
};

export default Dashboard;