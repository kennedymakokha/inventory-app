import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SkeletonList } from './skeleton';
import { useCallback, useEffect, useState } from 'react';
import { getDBConnection } from '../../services/db-service';
import { useSearch } from '../../context/searchContext';
import { uniqueInventory } from '../../../utils/useDropDown';
import PageHeader from '../../components/pageHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authStackParamList } from '../../../models';
import { useNavigation } from '@react-navigation/native';
import { getGroupedInventoryLogs } from '../../services/inventory.service';
import { useTheme } from '../../context/themeContext';

export default function InventoryScreen() {
    const initialState = {
        product_id: "",
        quantity: "",
        expiryDate: ""
    }
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [inventories, setInventories] = useState([])
    const { query, setQuery } = useSearch()
    const loadDataCallback = useCallback(async () => {
        try {
            const db = await getDBConnection();
            let storedItems: any = await getGroupedInventoryLogs(db);
            setInventories(storedItems)
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    }, []);
    const onRefresh = async () => {
        try {
            const db = await getDBConnection();
            setRefreshing(true);
            let storedItems: any = await getGroupedInventoryLogs(db);
            setInventories(storedItems)
            setRefreshing(false);
        } catch (error) {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadDataCallback();
    }, [loadDataCallback]);





    const filteredData = uniqueInventory(inventories).filter((e: any) => e.product_name.includes(query))
    type NavigationProp = NativeStackNavigationProp<authStackParamList>;
    const navigation = useNavigation<NavigationProp>();
    const { colors } = useTheme();
    return (
        <View className="flex-1 min-h-[300px]  px-4"
            style={{ flex: 1, backgroundColor: colors.background }}
        >
            {/* <PageHeader /> */}
            <View className="flex-1 ">
                {loading ? (
                    <SkeletonList />
                ) : <FlatList
                    data={filteredData}
                    keyExtractor={(item: any) => item.inventory_id}
                    renderItem={({ item }: any) => (
                        <TouchableOpacity
                            style={{ backgroundColor: colors.card }}
                            onPress={() => navigation.navigate('inventory_Details', { product: item })} className={`flex-row justify-between ${item.synced === 0 ? "bg-green-100" : "bg-green-50"} p-4 rounded-lg shadow-md mt-2`}>
                            <View>
                                <View >
                                    <Text style={{ color: colors.text }} className="font-bold  text-lg">
                                        {item.product_name}
                                    </Text>
                                </View>
                                <Text style={{ color: colors.subText }}>
                                    Stock: {item.qty}
                                </Text>

                            </View>
                            {/* <TouchableOpacity
                                onPress={() => openModal(item)}
                                className={`${item.product_quantity < 20 ? "bg-red-600" : "bg-green-600"} dark:bg-secondary-800 p-2 flex items-center justify-center rounded`}>
                                <Text className="text-white font-bold">Restock</Text>
                            </TouchableOpacity> */}
                        </TouchableOpacity>
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />}

            </View>
            {/* <View className="absolute bottom-5 left-5 gap-y-5 right-5 z-50 items-center">
                <View className="flex-row w-full  ">
                    <Fab icon="plus" loading={false} title="+" handleclick={() => setModalVisible(true)} />
                </View>

            </View> */}
        </View>

    );
}
