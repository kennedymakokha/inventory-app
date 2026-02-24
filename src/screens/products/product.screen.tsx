import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

import { getDBConnection } from '../../services/db-service';
import { ProductItem } from '../../../models';
import { createProductTable, getProducts, getSychedProducts, getUnsyncedProducts, saveProductItems } from '../../services/product.service';

import AddProductModal from './components/addProductModal';
import UploadProductsModal from './components/uploadProduct.modal';
import { validateItem } from '../validations/product.validation';
import PageHeader from '../../components/pageHeader';
import { createInventoryTable } from '../../services/inventory.service';
import { useCreateProductMutation } from '../../services/productApi';

import { useSearch } from '../../context/searchContext';
import { SkeletonList } from './skeleton';
import MultiFab from '../../components/multiFab';
import RadialFab from '../../components/multiFab';

const ProductScreen = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const { query, setQuery } = useSearch();
    const initialState = { product_name: "", price: "", expiryDate: "", initial_stock: "", description: "", quantity: 0, Bprice: 0 };

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [item, setItem] = useState(initialState);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [offset, setOffset] = useState(10);

    const [postProductToMongoDB] = useCreateProductMutation();

    const loadDataCallback = useCallback(async (offset = 0, filter = 'all') => {
        try {
            setLoading(true);
            const db = await getDBConnection();
            await createProductTable(db);
            await createInventoryTable(db);

            let storedItems: ProductItem[] = [];
            if (filter === 'all') storedItems = await getProducts(db);
            if (filter === 'synced') storedItems = await getSychedProducts(db, offset);
            if (filter === 'unsynced') storedItems = await getUnsyncedProducts(db, offset);

            setProducts(storedItems);
        } catch (error) {
            console.error('❌ Error loading products:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDataCallback(0);
        setRefreshing(false);
    };

    const AddProduct = async () => {
        if (!validateItem(item, setMsg)) return;

        try {
            const db = await getDBConnection();
            await createProductTable(db);
            await createInventoryTable(db);

            const storedItems = await saveProductItems(db, item, postProductToMongoDB);
            setProducts(storedItems);

            setItem(initialState);
            setModalVisible(false);
            setMsg({ msg: '✅ Product added!', state: 'success' });
        } catch (error: any) {
            setMsg({ msg: error.message || '❌ Could not add product.', state: 'error' });
        }
    };

    useEffect(() => {
        loadDataCallback(offset);
    }, [loadDataCallback, offset]);

    // Professional Product Card
    const renderProductCard = ({ item }: { item: ProductItem }) => {
        const lowStock = item.quantity <= 5; // threshold for low stock
        return (
            <View style={{
                backgroundColor: '#1e293b',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{item.product_name}</Text>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Ksh {item.price}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ color: lowStock ? '#ef4444' : '#22c55e', fontWeight: '600' }}>
                        {item.quantity} in stock
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>{item.expiryDate ? `Exp: ${item.expiryDate}` : ''}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            {/* Page Header */}
            <PageHeader />
            {/* <PageHeader
                component={() => (
                    <SearchBar
                        placeholder="Search products..."
                        searchText={query}
                        onChangeText={setQuery}
                    />
                )}
            /> */}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="h-12 bg-gray-100 px-2"
            >

                <View className="flex-row items-center h-12 gap-x-3 space-x-4 px-2">
                    {['all', 'synced', 'unsynced', 'all', 'synced', 'unsynced', 'all', 'synced', 'unsynced'].map(filter => (
                        <TouchableOpacity key={filter} className="bg-white min-w-[80px] px-4 py-2 rounded-md shadow">
                            <Text className="text-gray-800 text-center text-sm font-medium">{filter}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
                {/* {loading ? (
          <SkeletonList />
        ) : ( */}
                <FlatList
                    contentContainerStyle={{ paddingBottom: 120 }}
                    data={products.filter(p => p.product_name.toLowerCase().includes(query.toLowerCase()))}
                    keyExtractor={(item, index) => String(item.id || item.product_name || index)}
                    renderItem={renderProductCard}
                    onEndReached={() => setOffset(prev => prev + 10)}
                    onEndReachedThreshold={0.5}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
                {/* )} */}
            </View>

            {/* Modals */}
            <AddProductModal
                setMsg={setMsg}
                msg={msg}
                PostLocally={AddProduct}
                modalVisible={modalVisible}
                setItem={setItem}
                fetchProducts={loadDataCallback}
                item={item}
                setModalVisible={setModalVisible}
            />
            <UploadProductsModal
                setMsg={setMsg}
                msg={msg}
                PostLocally={AddProduct}
                modalVisible={uploadModalVisible}
                setItem={setItem}
                fetchProducts={loadDataCallback}
                item={item}
                setModalVisible={setUploadModalVisible}
            />

            {/* Floating Action Buttons */}
            {/* Multi Action FAB */}
            <RadialFab
                mainColor="#1e293b"
                mainIcon="menu"
                radius={120}    // how far buttons spread
                angle={90}      // fan angle
                actions={[
                    { icon: 'add-outline', label: 'Add Product', onPress: () => setModalVisible(true) },
                    { icon: 'cloud-upload-outline', label: 'Upload', onPress: () => setUploadModalVisible(true) },
                    { icon: 'settings-outline', label: 'Settings', onPress: () => console.log('Settings') },
                ]}
            />
        </View>
    );
};

export default ProductScreen;