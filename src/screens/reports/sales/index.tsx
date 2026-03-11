import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import SalesReportTable from '../components/salesTable';
import PageHeader from '../../../components/pageHeader';
import { getProductSalesReport, getTopProducts } from '../../../services/analytics.service';
import { adminFilter, salesFilter } from '../../../../utils/getsalesdata';
import { useSettings } from '../../../context/SettingsContext';
import { Theme } from '../../../utils/theme';
import PieChart from '../../dashbordItems/PieChart';
import RadialFab from '../../../components/multiFab';
import { getDBConnection } from '../../../services/db-service';

const PAGE_SIZE = 10;

const SalesReport = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const [sales, setSales] = useState<any[]>([]);
  const [sale, setSale] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [state, setState] = useState<Record<string, boolean>>({});
  const [showPie, setShowPie] = useState(false); // toggle state

  const filterData = user?.role === 'superAdmin' || user?.role === 'admin' ? adminFilter : salesFilter;

  const fetchSales = async (pageNumber = 1, append = false) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);
      let db = await getDBConnection();
      const [salesResult] = await db.executeSql("SELECT * FROM Sale LIMIT 10");
      console.log("Sales restored:", salesResult.rows.length);
      // setSale(salesResult)
      const [itemsResult] = await db.executeSql("SELECT * FROM SaleItems LIMIT 10");
      console.log("SaleItems restored:", itemsResult.rows.length);
      const selectedFilter = filterData.find((f) => f.title === filter);
      const filterId = selectedFilter ? selectedFilter.id : 0;

      const report = await getProductSalesReport({
        userRole: user.role === 'sales' ? 'sales' : 'admin',
        userId: user.id,
        filterId,
        page: pageNumber,
        pageSize: PAGE_SIZE,
      });

      if (append) setSales((prev) => [...prev, ...report]);
      else setSales(report);

      setHasMore(report.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching sales report:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchSales(1, false);
  }, [filter]);



  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSales(nextPage, true);
  };

  // Format sales data for pie chart: [{ key, value }]
  const pieData = sales.map((item) => ({
    key: item.product_name,
    value: Number(item.total_sales || 0),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Filter Tabs */}
      <PageHeader
        component={() => (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              gap: 4,
              paddingVertical: 12,
            }}
          >
            {filterData.map((tab: any) => {
              const isActive = state[tab.id] && filter === tab.title;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    setState((prev) => ({ ...prev, [tab.id]: true }));
                    setFilter(tab.title);
                  }}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    borderWidth: isActive ? 1 : 0,
                    borderColor: theme.border,
                    backgroundColor: isActive ? theme.elevated : theme.card,
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      fontWeight: '600',
                      color: isActive ? theme.text : theme.subText,
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />


      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {showPie ? (
          <PieChart title={` ${filter} Sales Report`} data={pieData.length ? pieData : []} />
        ) : (
          <>
            {/* Report Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                marginVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: Theme.success,
                }}
              >
                {filter} Sales Report
              </Text>
            </View>

            {/* Sales Table */}
            <SalesReportTable
              headers={[
                { key: 'product_name', label: 'Name', width: 180 },
                { key: 'quantity_sold', label: 'Quantity' },
                { key: 'total_sales', label: 'Sales' },
              ]}
              data={sales}
              onEndReached={loadMore}
              loading={loading || loadingMore}
              rowKey={(item) => `${item.product_id}`}
            />
          </>
        )}
      </ScrollView>
      <RadialFab
        mainColor={Theme.primary}
        mainIcon={showPie ? "list" : "menu"}
        radius={120}
        angle={90}
        mainAction={() => setShowPie(!showPie)}
        actions={showPie ? [] : [
          { icon: 'pie-chart-outline', label: 'Pie Chart ', onPress: () => setShowPie(!showPie) },
          { icon: 'cloud-download-outline', label: 'Download', onPress: () => console.log(true) },
        ]}
      />
    </View>
  );
};

export default SalesReport;