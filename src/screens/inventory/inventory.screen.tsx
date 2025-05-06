import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { SkeletonList } from './skeleton';
import { useCallback, useEffect, useState } from 'react';
import SearchBar from '../../components/searchBar';
import { Fab } from '../../components/Button';
import { getDBConnection } from '../../services/db-service';
import { createInventoryTable, getinventories, saveInventoryItem } from '../../services/inventory.service';
import { validateItem } from '../validations/Inventory.validation';
import InventoryModal from './components/addInventoryModal';
import { getProducts } from '../../services/product.service';
import { useSearch } from '../../context/searchContext';
import { uniqueInventory } from '../../../utils/useDropDown';

export default function InventoryScreen() {
    const initialState = {
        product_id: "",
        quantity: "",
    }
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [inventories, setInventories] = useState([])
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [item, setItem] = useState(initialState)
    const [product, setProduct] = useState(null)
    const { query, setQuery } = useSearch()
    const loadDataCallback = useCallback(async () => {
        try {
            const db = await getDBConnection();
            await createInventoryTable(db);
            let storedItems: any = await getinventories(db);
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
            let storedItems: any = await getinventories(db);
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

    const AddProduct = async () => {
        if (!validateItem(item, setMsg)) return;
        try {
            const db = await getDBConnection();
            await createInventoryTable(db);
            await saveInventoryItem(db, item);
            let storedItems: any = await getinventories(db);
            setInventories(storedItems);
            closeModal()
            setMsg({ msg: '✅ Inventory added!', state: 'success' });
        } catch (error: any) {
            console.log(error.message)
            setMsg({ msg: error.message || '❌ Could not add Inventory.', state: 'error' });
        }
    };

    const closeModal = () => {
        setItem(initialState);
        setModalVisible(false);
        setProduct(null)
        setMsg({ msg: "", state: "" })
    }
    const openModal = (data: any) => {
        setProduct(data)
        setItem(prev => ({ ...prev, product_id: data.product_id }))
        setModalVisible(true)
    }


    const filteredData = uniqueInventory(inventories).filter((e: any) => e.product_name.includes(query))

    return (
        <View className="flex-1 min-h-[300px] bg-secondary-900 px-5">
            <View className="flex-1 ">
                {loading ? (
                    <SkeletonList />
                ) : <FlatList
                    data={filteredData}
                    keyExtractor={(item: any) => item.inventory_id}
                    renderItem={({ item }: any) => (
                        <View className={`flex-row justify-between ${item.synced === 0 ? "bg-primary-100" : "bg-primary-50"} p-4 rounded-lg shadow-md mt-2`}>
                            <View>
                                <Text className="font-bold text-secondary-900 dark:text-white text-lg">
                                    {item.product_name}
                                </Text>
                                <Text className="text-gray-600 dark:text-gray-300">
                                    Stock: {item.product_quantity}
                                </Text>
                                <Text className="text-slate-900 dark:text-slate-200 font-bold">
                                    Price: @{parseFloat(item.product_price).toFixed(2)}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => openModal(item)}
                                className={`${item.product_quantity < 20 ? "bg-red-600" : "bg-green-600"} dark:bg-secondary-800 p-2 flex items-center justify-center rounded`}>
                                <Text className="text-white font-bold">Restock</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />}
                <InventoryModal
                    setMsg={setMsg}
                    product={product}
                    msg={msg}
                    closeModal={closeModal}
                    PostLocally={AddProduct}
                    modalVisible={modalVisible}
                    setItem={setItem}
                    fetchProducts={loadDataCallback}
                    item={item}
                />
            </View>
            <View className="absolute bottom-5 left-5 gap-y-5 right-5 z-50 items-center">
                <View className="flex-row w-full  ">
                    <Fab icon="plus" loading={false} title="+" handleclick={() => setModalVisible(true)} />
                </View>

            </View>
        </View>

    );
}
