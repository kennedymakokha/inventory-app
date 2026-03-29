import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import SalesReportTable from '../components/salesTable';
import { getProductSalesReport } from '../../../services/analytics.service';
import { adminFilter, salesFilter } from '../../../../utils/getsalesdata';
import PieChart from '../../dashbordItems/PieChart';
import RadialFab from '../../../components/multiFab';
import { useTheme } from '../../../context/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { v4 as uuidv4 } from "uuid";
const PAGE_SIZE = 10;

const SalesReport = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showPie, setShowPie] = useState(false);

  const filterData = user?.role === 'superAdmin' || user?.role === 'admin' ? adminFilter : salesFilter;

  const fetchSales = async (pageNumber = 1, append = false) => {
    try {
      pageNumber === 1 ? setLoading(true) : setLoadingMore(true);
      const selectedFilter = filterData.find((f) => f.title === filter);
      const report = await getProductSalesReport(undefined, selectedFilter as any, undefined, undefined, undefined, pageNumber, PAGE_SIZE);

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
      
      {/* 1. ABSOLUTE FLOATING BACK BUTTON */}
      <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[styles.floatingBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* 2. ABSOLUTE FLOATING TITLE */}
      <View pointerEvents="none" style={styles.absoluteHeader}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Analytics</Text>
          <View style={[styles.miniIndicator, { backgroundColor: colors.primary }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 3. FLOATING FILTER TABS (Inside Scroll but at top) */}
        <View style={styles.filterWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {filterData.map((tab: any) => {
                const isActive = filter === tab.title;
                return (
                    <TouchableOpacity
                    key={tab.id}
                    onPress={() => setFilter(tab.title)}
                    style={[
                        styles.filterTab,
                        { 
                            backgroundColor: isActive ? colors.primary : colors.card,
                            borderColor: isActive ? colors.primary : colors.border
                        }
                    ]}
                    >
                    <Text style={[styles.filterText, { color: isActive ? '#fff' : colors.subText }]}>
                        {tab.title}
                    </Text>
                    </TouchableOpacity>
                );
                })}
            </ScrollView>
        </View>

        {showPie ? (
          pieData.length ? (
            <View style={styles.chartContainer}>
                 <PieChart title={`${filter} Sales`} data={pieData} />
            </View>
          ) : (
            <View style={styles.emptyState}>
                <Ionicons name="bar-chart-outline" size={40} color={colors.border} />
                <Text style={{ color: colors.subText, marginTop: 10 }}>No data for chart</Text>
            </View>
          )
        ) : (
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableLabel, { color: colors.primary }]}>{filter} Sales Report</Text>
            </View>

            <SalesReportTable
              headers={[
                { key: 'product_name', label: 'Product Name', width: 180 },
                { key: 'quantity_sold', label: 'Qty', width: 80, align: 'right' },
                { key: 'total_sales', label: 'Revenue', width: 120, align: 'right' },
              ]}
              data={sales}
              onEndReached={loadMore}
              loading={loading || loadingMore}
              rowKey={(item) => `${item.product_id}${item.product_name}${uuidv4()}`} // Unique key for each row
            />
          </View>
        )}
      </ScrollView>

      {/* 4. RADIAL FAB */}
      <RadialFab
        mainColor={colors.primary}
        mainIcon={showPie ? 'list' : 'analytics'}
        radius={120}
        angle={90}
        mainAction={() => setShowPie(!showPie)}
        actions={showPie ? [] : [
              { icon: 'pie-chart-outline', label: 'Chart', onPress: () => setShowPie(true) },
              { icon: 'cloud-download-outline', label: 'Export', onPress: () => console.log('Exporting...') },
            ]
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
    floatingBackBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 25,
        left: 20,
        zIndex: 99,
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    absoluteHeader: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 25,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 90,
    },
    mainTitle: {
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    miniIndicator: {
        width: 20,
        height: 3,
        borderRadius: 2,
        marginTop: 4
    },
    scrollContent: {
        paddingTop: 110, // Moves content below the floating title
        paddingBottom: 120
    },
    filterWrapper: {
        marginBottom: 20,
    },
    filterScroll: {
        paddingHorizontal: 16,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize'
    },
    chartContainer: {
        paddingHorizontal: 16,
    },
    tableWrapper: {
        flex: 1,
    },
    tableHeaderRow: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    tableLabel: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center'
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    }
});

export default SalesReport;