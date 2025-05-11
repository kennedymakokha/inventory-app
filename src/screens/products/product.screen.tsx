

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

import { getDBConnection } from '../../services/db-service';
import { ProductItem, ToDoItem } from '../../../models';
import { createProductTable, fullSync, getProducts, getSychedProducts, getUnsyncedProducts, saveProductItems } from '../../services/product.service';
import { Fab } from '../../components/Button';
import AddProductModal from './components/addProductModal';
import renderItem from './components/productItem';
import { validateItem } from '../validations/product.validation';
import { useRoute } from '@react-navigation/native';
import { SkeletonList } from './skeleton';
import UploadProductsModal from './components/uploadProduct.modal';
import SearchBar from '../../components/searchBar';
import { useSearch } from '../../context/searchContext';
import PageHeader from '../../components/pageHeader';
import { createInventoryTable } from '../../services/inventory.service';


const ProductScreen = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const route = useRoute();
    const { query, setQuery } = useSearch()
    const { filter }: any = route.params;
    const initialState = {
        product_name: "",
        price: "",
        expiryDate: "",
        initial_stock: "",
        description: "",
        quantity: 0,
        Bprice: 0
    }
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [offset, setOffSet] = useState(10)
    const [item, setItem] = useState(initialState)
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadmodalVisible, setUploadModalVisible] = useState(false);




    const loadDataCallback = useCallback(async (offset: any, filter: any) => {
        try {
            const db = await getDBConnection();
            await createProductTable(db);
            let storedItems = [];
            if (filter === 'all') {
                storedItems = await getProducts(db);
            } else if (filter === 'synced') {
                storedItems = await getSychedProducts(db, offset);
            } else if (filter === 'unsynced') {
                storedItems = await getUnsyncedProducts(db, offset);
            }
            setProducts(storedItems); // even if it's empty, clear the list
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    }, [filter]);
    const onRefresh = async () => {
        try {
            console.log(filter);
            setRefreshing(true);

            const res: any = await loadDataCallback(0, filter); // Usually refresh starts at offset 0
            console.log(res);
            setProducts(res);
        } catch (error) {
            console.error('❌ Refresh failed:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadDataCallback(offset, filter);
    }, [loadDataCallback]);

    const AddProduct = async () => {
        if (!validateItem(item, setMsg)) return;
        try {
            const db = await getDBConnection();
            await createProductTable(db);
            await createInventoryTable(db);
            const storedItems = await saveProductItems(db, item);
            setProducts(storedItems);
            setItem(initialState);
            setModalVisible(false);
            setMsg({ msg: '✅ Product added!', state: 'success' });
        } catch (error: any) {
            console.log(error.message)
            setMsg({ msg: error.message || '❌ Could not add product.', state: 'error' });
        }
    };
    const loadMoreData = async () => {
        setOffSet(prev => (prev + 10))
    }
    // const deleteItem = async (id: number) => {
    //     try {
    //         const db = await getDBConnection();
    //         await deleteTodoItem(db, id);
    //         todos.splice(id, 1);
    //         setTodos(todos.slice(0));
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };


    return (
        <View className="flex-1 min-h-[300px] bg-slate-900 px-5">
            <PageHeader />
            <View className="flex-1 ">
                {loading ? (
                    <SkeletonList />
                ) : (<FlatList
                    contentContainerStyle={{ paddingBottom: 100 }}
                    data={products}
                    keyExtractor={(item, index) => String(item.id || item.product_name || index)}
                    renderItem={renderItem}
                    onEndReached={() => loadDataCallback(offset, filter)}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loading ? <ActivityIndicator className="my-4 text-secondary" /> : null}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                // contentContainerStyle={{ padding: 1 }}
                />)}



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
                    modalVisible={uploadmodalVisible}
                    setItem={setItem}
                    fetchProducts={loadDataCallback}
                    item={item}
                    setModalVisible={setUploadModalVisible}
                />
            </View>

            {/* Floating Button */}
            <View className="absolute bottom-5 left-5 gap-y-5 right-5 z-50 items-center">
                <View className="flex-row w-full justify-end ">
                    {/* <Fab icon="plus" loading={false} title="+" handleclick={onUploadPress} /> */}

                    <Fab icon="plus" loading={false} title="+" handleclick={() => setModalVisible(true)} />

                    {/* {loading ? (
                        <ActivityIndicator size="large" color="#007AFF" />
                    ) : (
                        <Fab outline loading={false}
                            title="Sync Now"
                            handleclick={handleSync} />
                    )} */}
                </View>

            </View>
        </View>

    );
};

export default ProductScreen;
