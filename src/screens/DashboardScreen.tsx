import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, useColorScheme } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getDBConnection } from '../services/db-service';
import { fetchGroupedProfit } from '../services/sales.service';
import { createSyncTable } from '../services/product.service';
import { Pressable } from 'react-native';
import { useSettings } from '../context/SettingsContext';

const screenWidth = Dimensions.get('window').width;

// Reusable StatCard for modern POS


const Dashboard = () => {
  const [weeklySales, setWeeklySales] = useState<number[]>(Array(7).fill(0));
  const [weeklyProfit, setWeeklyProfit] = useState<number[]>(Array(7).fill(0));
  const [labels] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [best, setBest] = useState({ product: "", value: "" });
  const [worst, setWorst] = useState({ product: "", value: "" });
  const [profit, setProfit] = useState("");
  const [low, setLow] = useState({ product: "", value: "" });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Never');
const { isDarkMode } = useSettings();
  const getLastSync = async () => {
    const db = await getDBConnection();
    await createSyncTable(db);
    const [results] = await db.executeSql(`SELECT last_sync FROM sync_status ORDER BY id DESC LIMIT 1`);
    if (results.rows.length > 0) setLastSync(new Date(results.rows.item(0).last_sync).toLocaleString());
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const db = await getDBConnection();
    const groupedTypes = ["non-profit", "best", "worst", "profit", "low-stock"];
    const results: any = {};

    for (const type of groupedTypes) {
      await fetchGroupedProfit(db, type, (data: any) => { results[type] = data; });
    }

    const weekdayMap: Record<string, number> = { '0': 6, '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
    const salesArray = Array(7).fill(0);
    const profitArray = Array(7).fill(0);
    (results["non-profit"] || []).forEach((row: any) => {
      const i = weekdayMap[row.weekday];
      salesArray[i] = parseFloat(row.total_sales) || 0;
      profitArray[i] = parseFloat(row.total_profit) || 0;
    });
    setWeeklySales(salesArray);
    setWeeklyProfit(profitArray);

    setBest({ product: results["best"]?.[0]?.product_name || "", value: results["best"]?.[0]?.profit || "" });
    setWorst({ product: results["worst"]?.[0]?.product_name || "", value: results["worst"]?.[0]?.profit || "" });
    setProfit(results["profit"]?.[0]?.total_profit || "");
    setLow({ product: results["low-stock"]?.[0]?.product_name || "", value: results["low-stock"]?.[0]?.quantity || "" });

    setLoading(false);
  };



  useEffect(() => {
    getLastSync();
    fetchDashboardData();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ flex: 1, padding:16, backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', paddingTop: 16 }}>
      {/* Top Stats Section */}
      <View className="flex-row flex-wrap justify-between mb-4">
        <View className="w-[48%] bg-white rounded-lg p-4 shadow">
          <Text className="text-gray-500">Total Sales</Text>
          <Text className="text-xl font-bold text-gray-900">$23,896</Text>
          <Text className="text-green-600">↑ 10%</Text>
        </View>

        <View className="w-[48%] bg-white rounded-lg p-4 shadow">
          <Text className="text-gray-500">Total Orders</Text>
          <Text className="text-xl font-bold text-gray-900">456</Text>
          <Text className="text-green-600">↑ 10%</Text>
        </View>

        <View className="w-[48%] bg-white rounded-lg p-4 shadow mt-4">
          <Text className="text-gray-500">Store Products</Text>
          <Text className="text-xl font-bold text-gray-900">77</Text>
          <Text className="text-red-600">↓ 32%</Text>
        </View>

        <View className="w-[48%] bg-white rounded-lg p-4 shadow mt-4">
          <Text className="text-gray-500">Store Availability</Text>
          <Text className="text-xl font-bold text-gray-900">Open</Text>
          <View className="flex-row mt-2">
            <Pressable className="bg-red-500 px-3 py-1 rounded mr-2">
              <Text className="text-white">Close</Text>
            </Pressable>
            <Pressable className="bg-green-500 px-3 py-1 rounded">
              <Text className="text-white">Open</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Statistics Section */}
      <View className="bg-white rounded-lg p-4 shadow">
        <Text className="text-lg font-semibold mb-2">Statistics: Total Sales</Text>

        {/* Bar Chart Mockup */}
        <View className="flex-row items-end justify-between mt-4">
          {/* 2021 */}
          <View className="items-center">
            <View className="w-6 h-32 bg-blue-800 rounded" />
            <View className="w-6 h-24 bg-blue-400 rounded mt-1" />
            <Text className="mt-2 text-xs">2021</Text>
          </View>

          {/* 2022 */}
          <View className="items-center">
            <View className="w-6 h-28 bg-blue-800 rounded" />
            <View className="w-6 h-20 bg-blue-400 rounded mt-1" />
            <Text className="mt-2 text-xs">2022</Text>
          </View>

          {/* 2023 */}
          <View className="items-center">
            <View className="w-6 h-36 bg-blue-800 rounded" />
            <View className="w-6 h-24 bg-blue-400 rounded mt-1" />
            <Text className="mt-2 text-xs">2023</Text>
          </View>

          {/* 2024 */}
          <View className="items-center">
            <View className="w-6 h-24 bg-blue-800 rounded" />
            <View className="w-6 h-12 bg-blue-400 rounded mt-1" />
            <Text className="mt-2 text-xs">2024</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Dashboard;