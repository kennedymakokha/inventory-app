import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { useSettings } from '../context/SettingsContext';
import { Theme } from '../utils/theme';

import PageHeader from '../components/pageHeader';
import { getHourlySalesByProduct, getLowStockProducts, getMonthlySales, getTodaySales, getTodayTransactions, getTopProducts } from '../services/analytics.service';
import DataGraph from './dashbordItems/DataGraph';
import PieChart from './dashbordItems/PieChart';
import LineGraph from './dashbordItems/lineGraph';
import MultiLineChart from './dashbordItems/lineGraph';
import { Dataset } from '../../models';
import { formatNumber } from '../../utils/formatNumbers';




const Dashboard = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;
  const [sales, setSales] = useState<any[]>([]);
  const [lowstcks, setlowstcks] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);


  const [TopProducts, setTopProducts] = useState([]);



  const [transactions, setTransactions] = useState(0);
  const [hourlySales, setHourlySales] = useState<Dataset[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const fetchHourlySales = async () => {
    try {
      const productDatasets = await getHourlySalesByProduct(user.role, user._id);

      setDatasets(productDatasets);
    } catch (error) {
      console.error("Error fetching hourly sales:", error);
    }
  };

  useEffect(() => {
    fetchHourlySales();
  }, []);

  useEffect(() => {
    console.log(user.role)
    const load = async () => {

      const totalToday: any = await getTodaySales(user.role, user._id);
      const tp: any = await getTopProducts(user.role, user._id);
      const mS = await getMonthlySales(user.role, user._id)
      setMonthlySales(mS)
      const todayTx = await getTodayTransactions(user.role, user._id);
      const stcks = await getLowStockProducts();
      setTopProducts(tp)
      setlowstcks(stcks)
      setSales(totalToday);
      setTransactions(todayTx);

    };

    load();

  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Page Header with Tabs */}
      {lowstcks.length > 0 && <PageHeader
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
      />}

      {/* Summary Cards */}


      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10, paddingHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View className='flex justify-center items-center' style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
            <Text style={{ color: theme.subText }}>Total Sales</Text>
            <Text style={{ color: Theme.primary, fontSize: 18, fontWeight: 'bold' }}>
              {formatNumber(sales) || 0}/-
            </Text>
          </View>
          {lowstcks.length > 0 && <View className='flex justify-center items-center' style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
            <Text style={{ color: theme.subText }}>Low Stock</Text>
            <Text style={{ color: Theme.danger, fontSize: 18, fontWeight: 'bold' }}>
              {lowstcks[0]?.product_name || 0}
            </Text>
          </View>}
          <View className='flex justify-center items-center' style={{ backgroundColor: theme.elevated, padding: 16, borderRadius: 12, minWidth: 140 }}>
            <Text style={{ color: theme.subText }}>Transactions</Text>
            <Text className='text-center' style={{ color: Theme.success, fontSize: 18, fontWeight: 'bold' }}>
              {transactions || 0}
            </Text>
          </View>

        </View>
      </ScrollView>
      <DataGraph title="Top Performing Products" data={TopProducts} />

      <MultiLineChart
        title="Hourly Sales"
        datasets={datasets.length ? datasets : []}
      />
      <PieChart title="Monthly sales" data={monthlySales} />





    </ScrollView>
  );
};

export default Dashboard;