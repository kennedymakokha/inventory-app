import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import PageHeader from '../../components/pageHeader'
import { useSettings } from '../../context/SettingsContext'
import { Theme } from '../../utils/theme'
import Icon from 'react-native-vector-icons/FontAwesome'
import { formatNumber } from '../../../utils/formatNumbers'
import { getSales } from '../../services/analytics.service'
import DateTimePicker from '@react-native-community/datetimepicker';
const filters = [
    { title: "Today", value: "today" },
    { title: "Week", value: "week" },
    { title: "Month", value: "month" },
    { title: "Year", value: "year" },
    { title: "Custom", value: "custom" },
];

const UserScreen = ({ route }: any) => {
    const { user } = route.params;

    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("today");
    const [sales, setSales] = useState(0);
    const [transactions, setTransactions] = useState(0);

    const [customDate, setCustomDate] = useState<string | undefined>();
    const [startDate, setStartDate] = useState<string | undefined>();
    const [endDate, setEndDate] = useState<string | undefined>();

    const [showCustomModal, setShowCustomModal] = useState(false);

    // ✅ Fetch data
    const fetchSales = async () => {
        const total = await getSales(
            user._id,
            selectedFilter as any,
            customDate,
            startDate,
            endDate
        );
        setSales(total);
    };

    useEffect(() => {
        fetchSales();
    }, [selectedFilter, customDate, startDate, endDate]);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>

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
                                                    ? Theme.primary
                                                    : theme.chipInactive
                                        }
                                    ]}
                                >
                                    <Text style={{
                                        color: selectedFilter === filter.value
                                            ? '#fff'
                                            : theme.chipTextInactive
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
            <View style={{ flexDirection: "row", gap: 12, padding: 16 }}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Icon name="dollar" size={28} color={theme.subText} />
                    <Text style={[styles.title, { color: theme.text }]}>Sales</Text>
                    <Text style={{ color: theme.subText }}>
                        {formatNumber(sales)}
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Icon name="exchange" size={28} color={theme.subText} />
                    <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
                    <Text style={{ color: theme.subText }}>
                        {transactions}
                    </Text>
                </View>
            </View>

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