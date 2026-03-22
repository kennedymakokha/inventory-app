import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    RefreshControl
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import PageHeader from '../../components/pageHeader';
import { useSearch } from '../../context/searchContext';

import { useSelector } from 'react-redux';
import Toast from '../../components/Toast';

import { useTheme } from '../../context/themeContext';
import { fetchPayments } from '../../services/analytics.service';
import { ScrollView } from 'react-native';

const filters = [
    { title: "Today", value: "today" },
    { title: "Week", value: "week" },
    { title: "Month", value: "month" },
    { title: "Year", value: "year" },
    { title: "Custom", value: "custom" },
];

const CustomersScreen = () => {

    const { query } = useSearch();
    const { user } = useSelector((state: any) => state.auth);
    const { business } = user;
    const [selectedFilter, setSelectedFilter] = useState("today");
    const initialState = {
        category_name: "",
        description: "",
        category_id: "",
        business_id: business._id
    };
    const [customDate, setCustomDate] = useState<string | undefined>();

    const { colors } = useTheme();
    const [data, setdata] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [msg, setMsg] = useState({ msg: "", state: "" });

    // Load data
    const loaddata = async () => {
        setLoading(true);
        try {
            const storeddata = await fetchPayments(selectedFilter);
            setdata(storeddata);
        } catch (err) {
            console.log(" loaddata error:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loaddata();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loaddata();
        setRefreshing(false);
    };

    const arr: any = []






    const renderCustomerCard = ({ item }: { item: { customer_phone: string, total_amount: string } }) => (

        <View className="flex w-full">
            <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <Text style={[styles.nameText, { color: colors.text }]}>{item?.customer_phone}</Text>
                <View className="flex items-center justify-end flex-row">
                    <Text className='text-end' style={{ color: colors.subText, fontWeight: "900", fontSize: 12, marginTop: 4 }}>
                        {item?.total_amount || ""}
                    </Text>
                </View>

            </TouchableOpacity>
        </View>
    );
    return (
        <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 16 }}>
            <View>

                <PageHeader
                    component={() => (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.filterScrollContainer}>
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
            </View>


            <FlatList
                data={data}
                keyExtractor={(item) => item.customer_phone}
                renderItem={renderCustomerCard}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 12 }}
                onEndReachedThreshold={0.5}
                onEndReached={loaddata}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />


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


        </View>
    );
};

const styles = StyleSheet.create({
    filterContainer: {
        paddingHorizontal: 2,
        paddingVertical: 8,
        alignItems: 'center'
    },
    filterScrollContainer: {
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
        width: '100%',
        padding: 14,
        borderRadius: 5,
        marginBottom: 16,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 6,
    },
    nameText: {
        fontWeight: '700',
        fontSize: 14,
    }
});

export default CustomersScreen;