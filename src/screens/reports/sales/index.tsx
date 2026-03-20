import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import SalesReportTable from '../components/salesTable';
import PageHeader from '../../../components/pageHeader';
import { getProductSalesReport } from '../../../services/analytics.service';
import { adminFilter, salesFilter } from '../../../../utils/getsalesdata';
import PieChart from '../../dashbordItems/PieChart';
import RadialFab from '../../../components/multiFab';
import { useTheme } from '../../../context/themeContext';

const PAGE_SIZE = 10;

const SalesReport = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { colors } = useTheme();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showPie, setShowPie] = useState(false);

  const filterData =
    user?.role === 'superAdmin' || user?.role === 'admin'
      ? adminFilter
      : salesFilter;

  const fetchSales = async (pageNumber = 1, append = false) => {
    try {
      pageNumber === 1 ? setLoading(true) : setLoadingMore(true);

      const selectedFilter = filterData.find((f) => f.title === filter);
      const filterId = selectedFilter ? selectedFilter.id : 0;


      const report = await getProductSalesReport( undefined, selectedFilter as any, undefined, undefined, undefined, pageNumber,  PAGE_SIZE);

   

      setSales(prev => (append ? [...prev, ...report] : report));
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

  const pieData = sales.map((item) => ({
    key: item.product_name,
    value: Number(item.total_sales || 0),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* FILTER HEADER */}
      <PageHeader
        component={() => (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              paddingVertical: 12,
            }}
          >
            {filterData.map((tab: any) => {
              const isActive = filter === tab.title;

              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setFilter(tab.title)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    margin: 4,
                    borderWidth: isActive ? 1 : 0,
                    borderColor: colors.border,
                    backgroundColor: isActive
                      ? colors.elevated
                      : colors.card,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '600',
                      color: isActive ? colors.text : colors.subText,
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

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {showPie ? (
          pieData.length ? (
            <PieChart
              title={`${filter}jj Sales Report`}
              data={pieData}
            />
          ) : (
            <Text
              style={{
                textAlign: 'center',
                marginTop: 40,
                color: colors.subText,
              }}
            >
              No data for chart
            </Text>
          )
        ) : (
          <>
            {/* HEADER */}
            <View
              style={{
                paddingHorizontal: 20,
                marginVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  textAlign: "center",
                  color: colors.primary,
                }}
              >
                {filter} Sales Report
              </Text>
            </View>

            {/* TABLE */}
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

      {/* FAB */}
      <RadialFab
        mainColor={colors.primary}
        mainIcon={showPie ? 'list' : 'menu'}
        radius={120}
        angle={90}
        mainAction={() => setShowPie(!showPie)}
        actions={
          showPie
            ? []
            : [
              {
                icon: 'pie-chart-outline',
                label: 'Pie Chart',
                onPress: () => setShowPie(true),
              },
              {
                icon: 'cloud-download-outline',
                label: 'Download',
                onPress: () => console.log(true),
              },
            ]
        }
      />
    </View>
  );
};

export default SalesReport;