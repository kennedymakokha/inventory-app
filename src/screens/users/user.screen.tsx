import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Platform,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import PageHeader from '../../components/pageHeader';
import StartCard from '../../components/startCard';
import DataGraph from '../dashbordItems/DataGraph';
import SalesReportTable from '../reports/components/salesTable';

import { useTheme } from '../../context/themeContext';
import { FormatDate } from '../../../utils/formatDate';
import {
    getDetailedUserStats,
    getProductSalesReport,
    getSalesByCategory,
    getTopProducts,
    getUserClockByDay
} from '../../services/analytics.service';
import RadialFab from '../../components/multiFab';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UsersStackParamList } from '../../../models/navigationTypes';

const filters = [
    { title: "Today", value: "today", icon: "today-outline" },
    { title: "Week", value: "week", icon: "calendar-outline" },
    { title: "Month", value: "month", icon: "stats-chart-outline" },
    { title: "Custom", value: "custom", icon: "options-outline" },
];

const UserScreen = ({ route }: any) => {
    const { user } = route.params;
       console.log("UE1o1",user)
    const { colors, isDarkMode } = useTheme();

    // States
    const [selectedFilter, setSelectedFilter] = useState("today");
    const [customDate, setCustomDate] = useState<string | undefined>();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showbyCategory, setShowbyCategory] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<UsersStackParamList, "User_Dashboard">>();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats] = useState({ totalTransactions: 0, totalSales: 0, cashTotal: 0, mpesaTotal: 0, cashCount: 0, mpesaCount: 0 });
    const [topProducts, setTopProducts] = useState([]);
    const [topCategoryProducts, setTopCategoryProducts] = useState([]);
    const [reports, setReports] = useState([]);
    const [sessions, setSessions] = useState<any[]>([]);

    const [isLocked, setIsLocked] = useState(user.status === 'locked');
    const [showLockModal, setShowLockModal] = useState(false);
    const [lockReason, setLockReason] = useState("");

    const fetchAnalytics = useCallback(async () => {
        const id = user.user_id || user._id;
        setLoading(true);
        try {
            const [clocks, totalStats, products, categories, reportData]: any = await Promise.all([
                getUserClockByDay(id, customDate),
                getDetailedUserStats(id, selectedFilter as any, customDate),
                getTopProducts(id, selectedFilter as any, customDate),
                getSalesByCategory(id, selectedFilter as any, customDate),
                getProductSalesReport(id, selectedFilter as any, customDate, undefined, undefined, 1, 30)
            ]);

            setSessions(clocks?.sessions || []);
            setStats(totalStats);
            setTopProducts(products);
            setTopCategoryProducts(categories);
            setReports(reportData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, selectedFilter, customDate]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
    };
    const handleToggleLock = () => {
        if (isLocked) {
            // Logic for unlocking (direct)
            console.log("Unlocking user:", user.user_id);
            setIsLocked(false);
        } else {
            // Open modal for locking
            setShowLockModal(true);
        }
    };

    const confirmLock = () => {
        console.log(`Locking user ${user.user_id} for: ${lockReason}`);
        setIsLocked(true);
        setShowLockModal(false);
        setLockReason("");
    };
    // Calculate session data with "Active" state support
    const sessionData = useMemo(() => {
        const calcMins = (start: string, end: string | null) => {
            if (!end) return 0;
            return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60));
        };
        const formatH = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

        const totalMins = sessions?.reduce((sum, s) => sum + calcMins(s.check_in_time, s.check_out_time), 0);

        return sessions.map(s => ({
            ...s,
            check_in_time: FormatDate(s.check_in_time),
            check_out_time: s.check_out_time ? FormatDate(s.check_out_time) : "Still Active",
            working_hours: s.check_out_time ? formatH(calcMins(s.check_in_time, s.check_out_time)) : "—",
            total_hours: formatH(totalMins)
        }));
    }, [sessions]);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>


            {/* MODERN FILTER BAR */}
            <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
                    {filters.map(filter => (
                        <TouchableOpacity
                            key={filter.value}
                            onPress={() => {
                                setSelectedFilter(filter.value);
                                if (filter.value === "custom") setShowDatePicker(true);
                                else setCustomDate(undefined);
                            }}
                            style={[
                                styles.filterChip,
                                { backgroundColor: selectedFilter === filter.value ? colors.primary : colors.background }
                            ]}
                        >
                            <Ionicons
                                name={filter.icon as any}
                                size={16}
                                color={selectedFilter === filter.value ? "#fff" : colors.subText}
                            />
                            <Text style={[styles.filterText, { color: selectedFilter === filter.value ? "#fff" : colors.text }]}>
                                {filter.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* HERO STATS */}
                <View style={styles.contentPadding}>
                    <StartCard {...stats} />

                    {/* CHART SECTION */}
                    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <DataGraph
                            pressed={() => setShowbyCategory(!showbyCategory)}
                            title={`Top ${showbyCategory ? "Categories" : "Products"}`}
                            data={showbyCategory ? topCategoryProducts : topProducts}
                        />
                    </View>

                    {/* SALES TABLE */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cart-outline" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sales Performance</Text>
                    </View>
                    <View style={[styles.tableContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <SalesReportTable
                            headers={[
                                { key: 'product_name', label: 'Item', width: 160 },
                                { key: 'quantity_sold', label: 'Qty' },
                                { key: 'total_sales', label: 'Total' },
                            ]}
                            data={reports}
                            loading={loading && !refreshing}
                            rowKey={(item: any) => `${item.product_id}`}
                        />
                    </View>

                    {/* ATTENDANCE TABLE */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Staff Attendance</Text>
                    </View>
                    <View style={[styles.tableContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <SalesReportTable
                            headers={[
                                { key: 'check_in_time', label: 'In', width: 130 },
                                { key: 'check_out_time', label: 'Out', width: 130 },
                                { key: 'working_hours', label: 'Dur.', width: 80 },
                            ]}
                            data={sessionData}
                            loading={loading && !refreshing}
                            rowKey={(item: any) => `${item.check_in_time}`}
                        />
                        {sessionData.length > 0 && (
                            <View style={[styles.totalFooter, { borderTopColor: colors.border }]}>
                                <Text style={{ color: colors.subText }}>Total Work Time: </Text>
                                <Text style={{ color: colors.primary, fontWeight: '800' }}>{sessionData[0].total_hours}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
            <RadialFab
                mainColor={isLocked ? colors.danger : colors.primary}
                mainIcon="settings-outline"
                actions={[
                    {
                        icon: isLocked ? 'lock-open-outline' : 'lock-closed-outline',
                        label: isLocked ? 'Unlock' : 'Lock',
                        color: isLocked ? colors.success : colors.danger,
                        onPress: handleToggleLock
                    },
                    {
                        icon: 'calendar-outline',
                        onPress: () => setShowDatePicker(true)
                    },
                    {
                        icon: 'message-outline',
                        onPress: () => navigation.navigate('User_Notifications', { user:user })
                    },
                ]}
            />
            {showDatePicker && (
                <DateTimePicker
                    value={customDate ? new Date(customDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => {
                        setShowDatePicker(false);
                        if (date) setCustomDate(date.toISOString());
                    }}
                />
            )}
            <Modal
                visible={showLockModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLockModal(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

                            <Text style={[styles.modalTitle, { color: colors.text }]}>Lock User Account</Text>
                            <Text style={[styles.modalSub, { color: colors.subText }]}>
                                Provide a reason for suspending {user.name || 'this staff member'}.
                            </Text>

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                placeholder="e.g. Discrepancy in daily cash report"
                                placeholderTextColor={colors.subText}
                                value={lockReason}
                                onChangeText={setLockReason}
                                multiline
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    onPress={() => setShowLockModal(false)}
                                    style={[styles.btn, { backgroundColor: colors.border }]}
                                >
                                    <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={confirmLock}
                                    disabled={!lockReason}
                                    style={[styles.btn, { backgroundColor: colors.danger, opacity: lockReason ? 1 : 0.5 }]}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '800' }}>Confirm Lock</Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    filterBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 }
        })
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    contentPadding: {
        padding: 16,
        gap: 20
    },
    sectionCard: {
        borderRadius: 20,
        padding: 10,
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        marginBottom: -10,
        paddingHorizontal: 4
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    tableContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 2,
    },
    totalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 15,
        borderTopWidth: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderWidth: 1,
    },
    modalHandle: {
        width: 40,
        height: 5,
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
    },
    modalSub: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        borderRadius: 16,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        fontSize: 15,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        height: 55,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default UserScreen;