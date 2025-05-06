import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuthContext } from '../context/authContext';
import { getDBConnection } from '../services/db-service';
import { fullSync, getUnsyncedProducts } from '../services/product.service';
import { pullServerUpdates } from '../services/pull.service';



const CustomDrawer: React.FC<DrawerContentComponentProps> = ({ navigation }) => {
    const { token, logout } = useAuthContext();
    const [data, setData] = useState<any[]>([])
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const logoutUser = async () => {
        await logout()

    }
    useEffect(() => {

        const fetchData = async () => {
            const db = await getDBConnection();
            let storedItems = await getUnsyncedProducts(db, 10);
            setData(storedItems)
            console.log(storedItems)
        }
        fetchData()
    }, [])
    const handleSync = async () => {
        setLoading(true);
        setMessage('');
        try {
            await fullSync();
            await pullServerUpdates()
            setMessage('✅ Sync successful!');
        } catch (err) {
            setMessage('❌ Sync failed.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <View className="flex-1 bg-secondary-900 pt-16 px-5">
            {/* Header */}
            <View className="items-center mb-10 border-b border-primary-500">
                <Image
                    source={require('../assets/logo.png')}
                    className="size-40 rounded-full mb-2"
                />
                <Text className="text-white text-lg">Welcome!</Text>
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
                <Icon name="swap-horizontal-outline" size={20} color="#fff" />
                <Text className="tracking-widest uppercase text-center text-white text-base ml-3">Inventory</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
                className="flex-row items-center my-4"
                onPress={() => navigation.navigate('profile')}
            >
                <Icon name="person-outline" size={20} color="#fff" />
                <Text className="tracking-widest uppercase text-center text-white text-base ml-3">Profile</Text>
            </TouchableOpacity> */}
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : <TouchableOpacity
                className="flex-row bg-red-500 py-4 rounded-md justify-center animate-pulse items-center my-4"
                onPress={handleSync}
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
