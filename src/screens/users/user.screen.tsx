import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import PageHeader from '../../components/pageHeader'
import { getDetailedUserStats, getProductSalesReport, getSalesByCategory, getTopProducts } from '../../services/analytics.service'
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/themeContext'
import StartCard from '../../components/startCard'
import DataGraph from '../dashbordItems/DataGraph'
import SalesReportTable from '../reports/components/salesTable'
const filters = [
    { title: "Today", value: "today" },
    { title: "Week", value: "week" },
    { title: "Month", value: "month" },
    { title: "Year", value: "year" },
    { title: "Custom", value: "custom" },
];

const UserScreen = ({ route }: any) => {
    const { user } = route.params;
    const { colors } = useTheme();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showbyCategory, setShowbyCategory] = useState(false);
    const [tablePressed, setTablePressed] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("today");
    const [stats, setStats] = useState({ totalTransactions: 0, totalSales: 0, cashTotal: 0, mpesaTotal: 0, cashCount: 0, mpesaCount: 0 });
    const [topProducts, setTopProducts] = useState([]);
    const [topCategoryProducts, setTopCategoryProducts] = useState([]);
    const [reports, setReports] = useState([]);
    const [customDate, setCustomDate] = useState<string | undefined>();
    const [startDate, setStartDate] = useState<string | undefined>();
    const [endDate, setEndDate] = useState<string | undefined>();
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState<any>(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const loadMore = () => {
        // if (!hasMore || loadingMore) return;

        // const nextPage = page + 1;
        // setPage(nextPage);
        // fetchAnalytics(nextPage, true);
    };
    const fetchAnalytics = async () => {
        // Ensure you use the correct ID property from your user object
        const id = user.user_id || user._id;

        // Fetch Transaction Count (Quantity of sales)
        const totalTransactions = await getDetailedUserStats(
            id,
            selectedFilter as any,
            customDate,
            startDate,
            endDate
        );
        setStats(totalTransactions);
        const productsResult: any = await getTopProducts(id, selectedFilter as any, customDate);
        setTopProducts(productsResult);
        const productsByCategoryResult: any = await getSalesByCategory(id, selectedFilter as any, customDate);
        setTopCategoryProducts(productsByCategoryResult);
        const reportData: any = await getProductSalesReport(id, selectedFilter as any, customDate, undefined, undefined, page, 20);
        setReports(reportData)
    };

    useEffect(() => {
        fetchAnalytics();

    }, [selectedFilter, customDate, startDate, endDate]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            {/* FILTERS */}
            <PageHeader
                component={() => (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterContainer}>
                            {filters.map(filter => (
                                <TouchableOpacity
                                    key={filter.value}
                                    onPress={() => {
                                        if (filter.value === "custom") {
                                            setShowDatePicker(true);
                                        }
                                        setSelectedFilter(filter.value);
                                    }}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor:
                                                selectedFilter === filter.value
                                                    ? colors.primary
                                                    : colors.chipInactive
                                        }
                                    ]}
                                >
                                    <Text style={{
                                        color: selectedFilter === filter.value
                                            ? '#fff'
                                            : colors.chipTextInactive
                                    }}>
                                        {filter.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                )}
            />

            {/* STATS */}
            <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
                <StartCard {...stats} />
                <DataGraph pressed={() => setShowbyCategory(!showbyCategory)} title={`Top Performing ${showbyCategory ? "Categories" : "Products"}`} data={showbyCategory ? topCategoryProducts ?? topCategoryProducts : topProducts ?? topProducts} />

                <SalesReportTable
                    onTablePressed={()=>setTablePressed(!tablePressed)}
                    headers={[
                        { key: 'product_name', label: 'Name', width: 180 },
                        { key: 'quantity_sold', label: 'Quantity' },
                        { key: 'total_sales', label: 'Sales' },
                    ]}
                    data={reports}
                    onEndReached={loadMore}
                    loading={loading || loadingMore}
                    rowKey={(item) => `${item.product_id}`}
                />
                {/* CUSTOM MODAL */}
                {showDatePicker && (
                    <DateTimePicker
                        value={customDate ? new Date(customDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(e, date) => {
                            setShowDatePicker(false);
                            if (date)
                                setCustomDate(date.toISOString());

                        }}
                    />
                )}

            </ScrollView>
        </View>
    )
}

export default UserScreen;

const styles = StyleSheet.create({
    filterContainer: {
        flexDirection: "row",
        padding: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 10,
    },
    card: {
        flex: 1,
        height: 120,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontWeight: "bold",
        fontSize: 16,
        marginTop: 6,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    modalBox: {
        width: '80%',
        padding: 20,
        borderRadius: 8
    },
    confirmBtn: {
        backgroundColor: '#22c55e',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center'
    }
});