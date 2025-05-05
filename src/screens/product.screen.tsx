

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

import { getDBConnection, getTodoItems, saveTodoItems, createTable, deleteTodoItem } from '../services/db-service';
import { ProductItem, ToDoItem } from '../../models';
import { ToDoItemComponent } from '../components/ToDoItem';
import { createProductTable, fullSync, getProducts, getUnsyncedProducts, saveProductItems } from '../services/product.service';
import { ProductItemConainer } from '../components/ProductItem';
import Button from '../components/Button';
import AddProductModal from './components/addProductModal';
import renderItem from './components/productItem';
import { validateItem } from './validations/product.validation';


const ProductScreen = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const initialState={ product_name: "",
        price: "",
        description: "",}
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [newProduct, setNewProduct] = useState('');
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [offset, setOffSet] = useState(10)
    const [item, setItem] = useState(initialState)
    const [modalVisible, setModalVisible] = useState(false);

    const [message, setMessage] = useState('');

    const handleSync = async () => {
        setLoading(true);
        setMessage('');
        try {
            await fullSync();
            setMessage('✅ Sync successful!');
        } catch (err) {
            setMessage('❌ Sync failed.');
        } finally {
            setLoading(false);
        }
    };
    const loadDataCallback = useCallback(async (offset: any) => {
        try {
            const initTodos: any = [];
            const db = await getDBConnection();
            await createProductTable(db);
            const storedItems = await getProducts(db, offset);
            if (storedItems.length > 0) {
                setProducts(storedItems);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);
    useEffect(() => {
        loadDataCallback(offset);
    }, [loadDataCallback]);
    const addTodo = async () => {
        if (!validateItem(item, setMsg)) return;
        try {
            setProducts([...products, { product_name: newProduct, price: '', description: '' }]);
            const db = await getDBConnection();
            let storedItems = await saveProductItems(db, item);
            setProducts(storedItems);
            setItem(initialState);
            setModalVisible(false)
            
        } catch (error) {
            console.error(error);
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
        <View className="flex-1 min-h-[800px] bg-secondary-900 p-5">

            <View className="flex-1 ">
             
                <FlatList
                    contentContainerStyle={{ paddingBottom: 100 }}
                    data={products}
                    keyExtractor={(item) => item.id || item.product_name}
                    renderItem={renderItem}
                    numColumns={2}
                    // onEndReached={loadMoreData}
                    // onEndReachedThreshold={0.5}
                    ListFooterComponent={loading ? <ActivityIndicator className="my-4 text-secondary" /> : null}
                // contentContainerStyle={{ padding: 1 }}
                />

                {!!message && (
                    <Text className="text-center mt-2 text-white">{message}</Text>
                )}

                <AddProductModal
                    setMsg={setMsg}
                    msg={msg}
                    PostLocally={addTodo}
                    modalVisible={modalVisible}
                    setItem={setItem}
                    fetchProducts={loadDataCallback}
                    item={item}
                    setModalVisible={setModalVisible}
                />
            </View>

            {/* Floating Button */}
            <View className="absolute bottom-5 left-5 gap-y-5 right-5 z-50 items-center">
                <Button loading={false} title="+" handleclick={() => setModalVisible(true)} />

                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" />
                ) : (
                    <Button loading={false} title="Sync Now" handleclick={handleSync} />
                )}
            </View>
        </View>

    );
};

export default ProductScreen;
