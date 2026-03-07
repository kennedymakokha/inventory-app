import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { useSettings } from '../context/SettingsContext';
import { Theme } from '../utils/theme';
import { DataSales } from '../../models';
import { getDBConnection } from '../services/db-service';
import { fetchCumulativeProfit, fetchGroupedProfit } from '../services/sales.service';
import { adminFilter, Adminheaders, getadminSalesReportData, getSalesReportData, salesFilter, salesheaders } from '../../utils/getsalesdata';
import PageHeader from '../components/pageHeader';
import TableContainer from './reports/components/salesTable';


const Dashboard = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const [db, setDb] = useState<any>(null);
  const [dbReady, setDbReady] = useState(false);
  const [datasales, setdataSales] = useState<DataSales | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('All');

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

    const fetchProfits = async () => {
      setLoading(true);

      try {
        const cumulativeData = await fetchCumulativeProfit(db, filter.toLowerCase());
        setdataSales(cumulativeData);

        const groupedData = await fetchGroupedProfit(db, filter.toLowerCase());
        setSales(groupedData);
      } catch (err) {
        console.error('❌ Fetch profits failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfits();
  }, [dbReady, filter]);

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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 4, paddingVertical: 12 }}>
            {filterData.map((tab: any) => {
              const isActive = activeTab === tab.title;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    setActiveTab(tab.title);
                    setFilter(tab.title);
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: isActive ? 1 : 0,
                    borderColor: theme.border,
                    backgroundColor: isActive ? theme.elevated : theme.card,
                  }}
                >
                  <Text style={{ fontWeight: '600', color: isActive ? theme.text : theme.subText }}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />

      {/* Summary Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10, paddingHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
            <Text style={{ color: theme.subText }}>Total Sales</Text>
            <Text style={{ color: Theme.primary, fontSize: 18, fontWeight: 'bold' }}>
              {datasales?.total_sales_revenue || 0}/-
            </Text>
          </View>

          <View style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
            <Text style={{ color: theme.subText }}>Total Profit</Text>
            <Text style={{ color: Theme.success, fontSize: 18, fontWeight: 'bold' }}>
              {datasales?.total_profit || 0}/-
            </Text>
          </View>

          {user?.role === 'superAdmin' && (
            <View style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
              <Text style={{ color: theme.subText }}>Pending Orders</Text>
              <Text style={{ color: Theme.danger, fontSize: 18, fontWeight: 'bold' }}>
                {datasales?.pending_orders || 0}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sales Table */}
      <View style={{ marginHorizontal: 10, marginBottom: 20 }}>
        <TableContainer
          headers={user?.role === 'admin' ? Adminheaders : salesheaders}
          data={user?.role === 'admin' ? getadminSalesReportData(sales) : getSalesReportData(sales)}
        />
      </View>
    </ScrollView>
  );
};

export default Dashboard;