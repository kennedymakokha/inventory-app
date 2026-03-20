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
import Icon from 'react-native-vector-icons/FontAwesome'
import { formatNumber } from "../../utils/formatNumbers";
import { useSocket } from "../context/socketContext";
import { Business, useBusiness } from "../context/BusinessContext";
import { useTheme } from "../context/themeContext";

const Dashboard = () => {
  const { user } = useSelector((state: any) => state.auth);
const { colors, isDarkMode } = useTheme();

  const { socket } = useSocket();
  const { business, updateBusiness, isLoading } = useBusiness();

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
        <View style={{ flexDirection: "row", gap: 12, padding: 20 }}>
          {[{ icon: "dollar", title: "Total Sales", value: `${formatNumber(sales) || 0}` },
          { icon: "money", title: "Transactions", value: `${transactions || 0}` },
          { icon: "thumbs-o-up", title: "Best Perfoming", value: `${TopProducts[0]?.value}` },
          { icon: "thumbs-o-down", title: "Worst Perfoming", value: "" }
          ].map((stat) => (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} key={stat.title} className="flex  px-10 max-w-[175px] h-32 bg-white rounded items-center justify-center">
              <Icon name={stat.icon} style={{ color: colors.subText }} size={30} className="size-10 text-center" />
              <Text style={{ fontWeight: "bold", color: colors.text }} className="text-xl text-center">{stat.title}</Text>
              <Text style={{ color: colors.subText }}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <DataGraph title="Top Performing Products" data={TopProducts} />

      <MultiLineChart startHour={startHour} // optional business start hour
        endHour={endHour} title="Hourly Sales" datasets={datasets || []} />

      <PieChart title="Monthly sales" data={monthlySales} />

    </ScrollView>
  );
};

export default Dashboard;