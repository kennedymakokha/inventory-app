import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Platform } from 'react-native';
import { SkeletonList } from './skeleton';
import { useCallback, useEffect, useState } from 'react';
import { getDBConnection } from '../../services/db-service';
import { useSearch } from '../../context/searchContext';
import { uniqueInventory } from '../../../utils/useDropDown';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authStackParamList } from '../../../models';
import { useNavigation } from '@react-navigation/native';
import { getFullInventoryLogs, getGroupedInventoryLogs, getInventoryLogs } from '../../services/inventory.service';
import { useTheme } from '../../context/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function InventoryScreen() {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [inventories, setInventories] = useState([]);
    const { query } = useSearch();
    const { colors } = useTheme();

    type NavigationProp = NativeStackNavigationProp<authStackParamList>;
    const navigation = useNavigation<NavigationProp>();

    const loadDataCallback = useCallback(async () => {

        try {
            const db = await getDBConnection();
            const Logs = await getFullInventoryLogs()
            console.log('Logs', Logs)
            let storedItems: any = await getGroupedInventoryLogs(db);
            setInventories(storedItems);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        loadDataCallback();
    }, [loadDataCallback]);

    const filteredData = uniqueInventory(inventories).filter((e: any) =>
        e.product_name?.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            {/* 1. ABSOLUTE BACK BUTTON - Occupies No Space */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.floatingBackBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>

            {/* 2. ABSOLUTE TITLE SECTION - Occupies No Space */}
            <View pointerEvents="none" style={styles.absoluteHeader}>
                <Text style={[styles.mainTitle, { color: colors.text }]}>Inventory</Text>
                <View style={[styles.miniIndicator, { backgroundColor: colors.primary }]} />
            </View>

            {/* 3. MAIN LIST - Starts at top (index 0) */}
            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ marginTop: 120, paddingHorizontal: 16 }}>
                        <SkeletonList />
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item: any) => item.inventory_id || item.product_id}
                        showsVerticalScrollIndicator={false}
                        // ContentContainerStyle provides padding so the first item isn't hidden behind the floating buttons
                        contentContainerStyle={styles.listPadding}
                        renderItem={({ item }: any) => {
                            const isLowStock = item.qty < 10;
                            return (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('inventory_Details', { product: item })}
                                    style={[styles.inventoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                >
                                    <View style={styles.cardLeft}>
                                        <View style={[styles.statusLine, { backgroundColor: isLowStock ? "#ef4444" : "#22c55e" }]} />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={[styles.productName, { color: colors.text }]}>{item.product_name}</Text>
                                            <Text style={{ color: colors.subText, fontSize: 11 }}>In Stock</Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardRight}>
                                        <Text style={[styles.qtyText, { color: isLowStock ? "#ef4444" : colors.text }]}>{item.qty}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={loadDataCallback} tintColor={colors.primary} />
                        }
                    />
                )}
            </View>
        </View>
    );
}

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
        fontSize: 18,
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
    listPadding: {
        paddingTop: 120, // Only padding, not layout space
        paddingHorizontal: 16,
        paddingBottom: 40
    },
    inventoryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 10,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusLine: {
        width: 4,
        height: 25,
        borderRadius: 2,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
    },
    cardRight: {
        justifyContent: 'center',
    },
    qtyText: {
        fontSize: 18,
        fontWeight: '900',
    },
});