import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'
import { getProducts } from '../../services/product.service';
import { getDBConnection } from '../../services/db-service';
import { ProductItem } from '../../../models';
import CheckoutModal from './components/checkout';
import { createSalesTable, finalizeSale } from '../../services/sales.service';
import Toast from '../../components/Toast';

import { InputContainer } from '../../components/Input';
import { useSearch } from '../../context/searchContext';
import { SkeletonList } from './components/skeleton';


const SalesScreen = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [batchVisible, setbatchVisible] = useState<Record<string, string>>({});
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [state, setState] = useState<Record<string, boolean>>({});
    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true)
            const db = await getDBConnection();
            const fetchedProducts: any = await getProducts(db);
            setProducts(fetchedProducts);
            setLoading(false)
        };
        loadProducts();
    }, []);
    const PostSale = async () => {

        try {
            const db = await getDBConnection();
            await createSalesTable(db);
            await finalizeSale(db, cart);
            const fetchedProducts: any = await getProducts(db);
            setProducts(fetchedProducts);
            setModalVisible(false);
            setQuantities({})
            setState({})
            setCart([])
            setMsg({ msg: '✅ Sale Posted!', state: 'success' });
        } catch (error: any) {
            console.log(error.message)
            setMsg({ msg: error.message || '❌ Could not add product.', state: 'error' });
        }
    };
    const lastTapRef = useRef<number>(0);

    const handleDoubleTap = (productId: string) => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300; // ms

        if (lastTapRef.current && now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
            setbatchVisible((prev: any) => ({ ...prev, [productId]: true }));
        } else {
            lastTapRef.current = now;
        }
    };
    const handleAddToCart = async (product: ProductItem) => {
        const qty = parseInt(quantities[product?.id]) || 0;
        if (qty <= 0) {
            setMsg({ msg: 'Please enter a valid quantity.!', state: 'error' });

            return;
        }
        if (qty > product?.quantity) {
            setQuantities((prev) => ({
                ...prev,
                [product.id]: "",
            }))
            setMsg({ msg: 'Quantity exceeds available stock.!', state: 'error' });

            return;
        }
        setCart((prevCart: any) => {
            const existing = prevCart.find((item: any) => item.id === product.id);
            if (existing) {
                // Update quantity if product already in cart
                return prevCart.map((item: any) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + qty }
                        : item
                );
            } else {
                // Add new item to cart
                return [...prevCart, { ...product, quantity: qty }];
            }
        });
        setbatchVisible((prev: any) => ({ ...prev, [product.id]: false }));
        setQuantities((prev) => ({ ...prev, [product.id]: '' }));
        setState((prev) => ({
            ...prev,
            [product.id]: true,
        }))
    };
    useEffect(() => {
        setTimeout(() => {
            setMsg({ msg: "", state: "" })
        }, 2000);
    }, [msg.msg])


    const total = cart.reduce((sum, item: any) => sum + item.quantity * item.price, 0);
    const renderItem = ({ item }: any) => (
        <TouchableOpacity className="flex-row bg-green-100 mx-4 my-2 rounded-xl shadow p-3 items-center"  >
            {/* <Image source={item.image} className="w-12 h-8 mr-4 resize-contain" /> */}
            < View className="flex-1 " >
                <View className="flex-row gap-x-2 items-center">
                    <TouchableOpacity
                        onPress={() => {
                            setQuantities((prev) => ({
                                ...prev,
                                [item.id]: (parseInt(prev[item.id] || '0', 10)) + 1,
                            })); setState((prev) => ({
                                ...prev,
                                [item.id]: false,
                            }))
                        }}
                    >
                        <Text className="font-bold text-base">{item.product_name}</Text>
                    </TouchableOpacity>
                    {quantities[item.id] && <TouchableOpacity
                        onPress={() => {
                            setQuantities((prev) => ({
                                ...prev,
                                [item.id]: (parseInt(prev[item.id] || '0', 10)) - 1,
                            }))
                            setState((prev) => ({
                                ...prev,
                                [item.id]: false,
                            }))
                        }}
                        className="bg-green-600 px-2 my-1  h-6 flex items-center justify-center rounded ml-4" >
                        <Text className="text-white text-xs">{quantities[item.id]}</Text>
                    </TouchableOpacity>}
                    {batchVisible[item.id] && <TextInput className={`px-4 mr-2  w-20 h-4 flex items-center  text-xs font-bold text-base border  rounded-lg `}
                        onChangeText={(text: string) =>
                            setQuantities((prev) => ({
                                ...prev,
                                [item.id]: text,
                            }))
                        }
                        keyboardType="numeric"
                    />}

                    {state[item.id] ? <Icon name="cart-arrow-down" color="#1e293b" size={20} /> : quantities[item.id] && <TouchableOpacity
                        onPress={() => handleAddToCart(item)}
                        className="bg-green-600 px-4 h-6  rounded "
                    >
                        <Text className="text-white font-semibold">Add</Text>
                    </TouchableOpacity>}

                </View>

                <Text className="text-gray-500 text-xs">{item.description}</Text>
                <View className="flex-row justify-between items-center mt-2">
                    <TouchableWithoutFeedback onPress={() => handleDoubleTap(item.id)} className="bg-slate-400 px-2 py-1 rounded">
                        <Text className="text-xs">{item.quantity} {item.quantity !== 1 ? 'pcs' : 'pc'}</Text>
                    </TouchableWithoutFeedback>
                    <Text className="font-bold text-green-700  text-base">Ksh {item.price.toFixed(2)}</Text>
                </View>
            </View >
        </TouchableOpacity >
    );
    const { query, setQuery } = useSearch();
    const filtered = products.filter((item: any) => item.product_name.includes(query))
    return (
        <View className="flex-1 dark:bg-slate-900 ">
            <View className="bg-green-700 p-4 rounded-b-2xl">
                <View>
                    <Text className="text-white text-xl font-bold">Joana Leite</Text>
                    <View className="bg-gray-200 px-2 py-1 rounded mt-1 self-start">
                        <Text className="text-xs font-semibold text-gray-700">SO-00001</Text>
                    </View>
                    <Text className="text-white text-xs mt-1">Req. ship date Nov 28, 2019</Text>
                    <View className="flex-row space-x-2 mt-2">
                        <Text className="bg-green-500 text-white px-2 py-1 rounded text-xs">Fulfilled</Text>
                        <Text className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Paid $1,000.00</Text>
                    </View>
                </View>
            </View>
            {/* <Text className="text-2xl font-bold text-center dark:text-slate-900 text-white mb-4">Sales</Text> */}
            {loading ? (
                <SkeletonList />
            ) : <FlatList
                data={filtered}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: cart.length > 0 ? 120 : 20 }}
                keyExtractor={(item: any) => item.id.toString()}
            />}
            {msg.msg && <Toast msg={msg.msg} state={msg.state} />}
            {cart.length > 0 && (
                <View className="absolute bottom-0 left-0 right-10 bg-transparent w-full dark:bg-slate-800 p-4 border-t border-gray-200 dark:border-slate-700 shadow-md">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                Cart Total: Ksh {total.toFixed(2)}
                            </Text>
                            <View className="bg-red-600 rounded-full w-6 h-6 items-center justify-center ml-2">
                                <Text className="text-white text-xs font-bold">{cart.length}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            // onPress={handleCheckout}
                            onPress={() => setModalVisible(true)}
                            className="mt-2 bg-secondary-500 rounded p-3 flex-row justify-center items-center"
                        >
                            <Text className="text-center text-black font-bold text-lg">Checkout</Text>
                        </TouchableOpacity>
                    </View>

                </View>

            )}

            <CheckoutModal
                setMsg={setMsg}
                msg={msg}
                cartItems={cart}
                PostLocally={PostSale}
                modalVisible={modalVisible}
                // setItem={setItem}
                // fetchProducts={loadDataCallback}
                // item={item}
                setModalVisible={setModalVisible}
            />
        </View>
    );
};

export default SalesScreen;
