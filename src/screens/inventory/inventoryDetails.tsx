import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { getDBConnection } from '../../services/db-service'
import SalesReportTable from '../reports/components/salesTable'
import { FormatDate } from '../../../utils/formatDate'
import { getInventoryLogs, getInventoryTotals } from '../../services/inventory.service'
import { useTheme } from '../../context/themeContext'
import { v4 as uuidv4 } from "uuid";
const PAGE_SIZE = 20;
const InventoryDetails: React.FC = ({ route, navigation }: any) => {
    const { product } = route.params;
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const { colors } = useTheme();

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const db = await getDBConnection();
            const logs = await getInventoryLogs(db, product.product_id, 1, PAGE_SIZE);
            console.log(logs)
            setData(logs);
            setPage(1);
            setHasMore(logs.length === PAGE_SIZE);
        } catch (error) {
            console.error('Initial inventory load error:', error);
        } finally {
            setLoading(false);
        }
    }, [product.product_id]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        try {
            setLoadingMore(true);

            const db = await getDBConnection();
            const nextPage = page + 1;

            const logs = await getInventoryLogs(
                db,
                product.product_id,
                nextPage,
                PAGE_SIZE
            );

            if (logs.length > 0) {
                setData(prev => [...prev, ...logs]);
                setPage(nextPage);
            }

            if (logs.length < PAGE_SIZE) setHasMore(false);

        } catch (error) {
            console.error('Load more inventory error:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, page, product.product_id]);


    const tableData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            createdAt: FormatDate(item.createdAt),
            batch_number: item.batchNumber || '---',
            expiry_date: item.expiry_date ? FormatDate(item.expiry_date) : '---'
        }));
    }, [data]);
    const [totals, setTotals] = useState({
        stock: 0,
        restock: 0,
        sales: 0,
        adjustIn: 0,
        adjustOut: 0
    });

    const loadTotals = async () => {
        try {
            const db = await getDBConnection();
            const result = await getInventoryTotals(db, product.product_id);
            setTotals(result);
        } catch (e) {
            console.error("Totals error:", e);
        }
    };
    useEffect(() => {
        loadTotals()
        loadInitialData();
    }, [loadInitialData]);
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            {/* 1. ABSOLUTE BACK BUTTON */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.floatingBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>

            {/* 2. ABSOLUTE TITLE */}
            <View pointerEvents="none" style={styles.absoluteHeader}>
                <Text numberOfLines={1} style={[styles.mainTitle, { color: colors.text }]}>
                    {product.product_name}
                </Text>
                <View style={[styles.miniIndicator, { backgroundColor: colors.primary }]} />
            </View>

            {/* 3. CONTENT CONTAINER */}
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 100 }}>

                {/* RESTORED STATS BAR */}
                <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>CURRENT</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{totals.stock}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>ENTRIES</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{data.length}</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <SalesReportTable
                        headers={[
                            { key: "createdAt", label: "Date", width: 110 },
                            { key: "reference_type", label: "Type", width: 90 },
                            { key: "quantity", label: "Qty", width: 60, align: 'right' },
                            { key: "batch_number", label: "Batch", width: 100 },
                            { key: "expiry_date", label: "Expiry", width: 100 },
                        ]}
                        data={tableData}
                        onEndReached={loadMore}
                        loading={loadingMore}
                        rowKey={(item) => item.inventory_log_id.toString()}
                    />
                )}
            </View>
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
        left: 80,
        right: 80,
        alignItems: 'center',
        zIndex: 90,
    },
    mainTitle: {
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center'
    },
    miniIndicator: {
        width: 20,
        height: 3,
        borderRadius: 2,
        marginTop: 4
    },
    statsBar: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 15, // Space between bar and table
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#888',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    divider: {
        width: 1,
        height: '60%',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default InventoryDetails;