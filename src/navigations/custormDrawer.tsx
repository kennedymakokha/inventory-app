import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuthContext } from '../context/authContext';
import { getDBConnection } from '../services/db-service';
import { createProductTable, getLastSyncTime, getUnsyncedProducts, markProductAsSynced, syncAllProducts } from '../services/product.service';
import { pullServerUpdates, updateLocalProduct } from '../services/pull.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBulksyncMutation, usePullProductsQuery, usePullupdatedsinceQuery, useSyncProductMutation } from '../services/productApi';
import { getUnsyncedInventory } from '../services/inventory.service';
import { handleSync } from '../../utils/syncFunctions';
import { usePullinventoryQuery, useSyncInventoryMutation } from '../services/inventoryApi';
import { getNow } from '../../utils';
import { useSelector } from 'react-redux';
import { usePullSalesQuery, useSyncSalesMutation } from '../services/salesApi';




const CustomDrawer: React.FC<DrawerContentComponentProps> = ({ navigation }) => {

    const { token, logout } = useAuthContext();
    const [data, setData] = useState<any[]>([])
    const [lastSync, setLastSync] = useState('2025-05-05T20:20:16.065Z')
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncProduct] = useBulksyncMutation()
    const [syncInventory] = useSyncInventoryMutation()
    const [syncSales] = useSyncSalesMutation()

    const { data: Products, error, refetch } = usePullupdatedsinceQuery(lastSync)
    const { data: inventories, refetch: refetchinentory } = usePullinventoryQuery(lastSync)
    const { data: sales, refetch: refetchSales } = usePullSalesQuery(lastSync)
    const { user } = useSelector((state: any) => state.auth)

    const logoutUser = async () => {
        await logout()
        await AsyncStorage.clear()
    }

    // const handleSyncs = async () => {
    //     await refetch()
    //     await refetchSales()
    //     await refetchinentory()
    //     getLastSync()
    //     handleSync({ syncProduct,syncSales, sales, syncInventory, setMessage, products: Products, inventories, setLoading })
    // }
    // useEffect(() => {

    //     getLastSync()
    // }, [inventories])const sync = 

  
    const syncLocalProduct = async () => {
        try {
            await refetch()
            setLoading(true)
            const db = await getDBConnection();
            await syncAllProducts(db, Products, syncProduct)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.log(error)
        }

    }
    return (
        <View className="flex-1 bg-secondary-900 pt-16 px-5">
            {/* Header */}
            <View className="items-center mb-10 border-b border-primary-500">
                <Image
                    source={require('../assets/logo.png')}
                    className="size-40 rounded-full mb-2"
                />
                <Text className="text-white text-lg">Welcome! {user.name}</Text>
            </View>
            {!!message && (
                <Text className="text-center mt-2 text-white">{message}</Text>
            )}
            {/* Links */}
            <TouchableOpacity
                className="flex-row items-center my-4"
                onPress={() => navigation.navigate('Home', { screen: `dashboard` })}
            >
                <Icon name="home-outline" size={20} color="#fff" />
                <Text className="tracking-widest uppercase text-center text-white text-base ml-3">Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="flex-row items-center my-4"
                onPress={() =>
                    navigation.navigate('Home', { screen: `products` })
                    // navigation.navigate('products')
                }
            >
                <Icon name="swap-horizontal-outline" size={20} color="#fff" />
                <Text className="tracking-widest uppercase text-center text-white text-base ml-3">Products</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="flex-row items-center my-4"
                onPress={() => navigation.navigate('Home', { screen: `inventory` })
                    // navigation.navigate('inventory')
                }
            >
                <Icon name="cog" size={20} color="#fff" />
                <Text className="tracking-widest uppercase text-center text-white text-base ml-3">Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="flex-row items-center my-4"
                onPress={() => navigation.navigate('Home', { screen: `sales` })
                    // navigation.navigate('inventory')
                }
            >
                <Icon name="swap-horizontal-outline" size={20} color="#fff" />
                <Text className="tracking-widest uppercase text-center text-white text-base ml-3">sales</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="flex-row items-center my-4"
                onPress={() => navigation.navigate('Home', { screen: `salesreport` })
                    // navigation.navigate('inventory')
                }
            >
                <Icon name="book" size={20} color="#fff" />
                <Text className="tracking-widest uppercase text-center text-white text-base ml-3">Sales Report</Text>
            </TouchableOpacity>
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : <TouchableOpacity
                className="flex-row bg-red-500 py-4 rounded-md justify-center animate-pulse items-center my-4"
                onPress={() => syncLocalProduct()}
            >
                <MaterialCommunityIcons name="cloud-sync" size={30} color="#fff" />
                <Text className="text-white text-base text-bold text-xl ml-3">Sync</Text>
            </TouchableOpacity>}
            {/* Footer */}
            <View className="mt-auto mb-20 border-t border-gray-700 pt-5">
                <TouchableOpacity onPress={logoutUser}>
                    <Text className="text-primary-500 text-center text-[24px] text-base">Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CustomDrawer;
