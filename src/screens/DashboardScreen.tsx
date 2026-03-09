import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { useSettings } from '../context/SettingsContext';
import { Theme } from '../utils/theme';
import { DataSales } from '../../models';
import { getDBConnection } from '../services/db-service';

import { adminFilter, Adminheaders, getadminSalesReportData, getSalesReportData, salesFilter, salesheaders } from '../../utils/getsalesdata';
import PageHeader from '../components/pageHeader';
import TableContainer from './reports/components/salesTable';
import { getLowStockProducts, getMonthlySales, getTodaySales, getTodayTransactions, getTopProducts } from '../services/analytics.service';
import DataGraph from './dashbordItems/DataGraph';
import AnimatedPieChart from './dashbordItems/PieChart';



const Dashboard = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const [db, setDb] = useState<any>(null);
  const [dbReady, setDbReady] = useState(false);
  const [datasales, setdataSales] = useState<DataSales | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [lowstcks, setlowstcks] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [TopProducts, setTopProducts] = useState([]);

  const filterData = user?.role === 'superAdmin' ? adminFilter : salesFilter;

  // ---------------- INIT DB ----------------
  useEffect(() => {
    const initDB = async () => {
      try {
        const connection = await getDBConnection();


        setDb(connection);
        setDbReady(true);
      } catch (err) {
        console.error('❌ Failed to initialize DB:', err);
      }
    };

    initDB();
  }, []);

  // ---------------- FETCH SALES DATA ----------------
  useEffect(() => {
    if (!dbReady) return;


  }, [dbReady, filter]);

  const [transactions, setTransactions] = useState(0);

  useEffect(() => {

    const load = async () => {

      const db = await getDBConnection();

      const todaySales = await getTodaySales(db);
      const tp: any = await getTopProducts(db);
      const mS = await getMonthlySales(db)
      console.log(mS)
      setMonthlySales(mS)
      const todayTx = await getTodayTransactions(db);
      const stcks = await getLowStockProducts(db);
      setTopProducts(tp)
      setlowstcks(stcks)
      setSales(todaySales);
      setTransactions(todayTx);

    };

    load();

  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={{ marginTop: 10, color: theme.text }}>Loading dashboard...</Text>
      </View>
    );
  }


  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Page Header with Tabs */}
      <PageHeader
        component={() => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10, paddingHorizontal: 10 }}>
            <View style={{ flexDirection: 'row', gap: 12, }}>
              {lowstcks.map((item, i) => (<View key={i} className='flex justify-center flex-row gap-x-2 items-center' style={{ borderWidth: 1, borderColor: Theme.danger, backgroundColor: theme.elevated, padding: 1, borderRadius: 2, minWidth: 140 }}>
                <Text style={{ color: theme.subText }}>{item.product_name}</Text>
                <Text style={{ color: Theme.danger, fontSize: 18, fontWeight: 'bold' }}>
                  {item.quantity || 0}
                </Text>
              </View>))}
            </View>
          </ScrollView>
        )}
      />

      {/* Summary Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10, paddingHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View className='flex justify-center items-center' style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
            <Text style={{ color: theme.subText }}>Total Sales</Text>
            <Text style={{ color: Theme.primary, fontSize: 18, fontWeight: 'bold' }}>
              {sales || 0}/-
            </Text>
          </View>
          <View className='flex justify-center items-center' style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
            <Text style={{ color: theme.subText }}>Total Sales</Text>
            <Text style={{ color: Theme.primary, fontSize: 18, fontWeight: 'bold' }}>
              {sales || 0}/-
            </Text>
          </View>
          <View className='flex justify-center items-center' style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
            <Text style={{ color: theme.subText }}>Transactions</Text>
            <Text className='text-center' style={{ color: Theme.success, fontSize: 18, fontWeight: 'bold' }}>
              {transactions || 0}
            </Text>
          </View>

        </View>
      </ScrollView>
      <DataGraph title="Top Performing Products" data={TopProducts} />
      <AnimatedPieChart title="Monthly sales" data={TopProducts} />



      {/* Sales Table */}
      {/* <View style={{ marginHorizontal: 10, marginBottom: 20 }}>
        <TableContainer
          headers={user?.role === 'admin' ? Adminheaders : salesheaders}
          data={user?.role === 'admin' ? getadminSalesReportData(sales) : getSalesReportData(sales)}
        />
      </View> */}
    </ScrollView>
  );
};

export default Dashboard;