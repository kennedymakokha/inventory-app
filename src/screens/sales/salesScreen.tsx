import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Keyboard
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { getProducts } from '../../services/product.service';
import { getDBConnection } from '../../services/db-service';
import { DataSales, ProductItem } from '../../../models';
import CheckoutModal from './components/checkout';
import { createSalesTable, fetchCumulativeProfit, finalizeSale } from '../../services/sales.service';
import Toast from '../../components/Toast';

import { useSearch } from '../../context/searchContext';
import { SkeletonList } from './components/skeleton';
import PageHeader from '../../components/pageHeader';
import SearchBar from '../../components/searchBar';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

const SalesScreen = () => {
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [cart, setCart] = useState<ProductItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [batchVisible, setBatchVisible] = useState<Record<string, string>>({});
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [sellingPrices, setSellingPrices] = useState<Record<string, string>>({});
    const [state, setState] = useState<Record<string, boolean>>({});
    const [datasales, setdataSales] = useState<DataSales | null>(null);
    const { query } = useSearch();

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            const db = await getDBConnection();
            const fetchedProducts: ProductItem[] = await getProducts(db);
            setProducts(fetchedProducts);
            setLoading(false);
        };
        loadProducts();
    }, []);
    const fetchProfits = async () => {
        setLoading(true)
        const db = await getDBConnection();
        fetchCumulativeProfit(db, "today", (data: any) => {
            setdataSales(data);
            setLoading(false)
        });

    }
    const PostSale = async () => {
        try {
            const db = await getDBConnection();
            await createSalesTable(db);
            await finalizeSale(db, cart);
            const fetchedProducts: ProductItem[] = await getProducts(db);
            setProducts(fetchedProducts);
            setModalVisible(false);
            setQuantities({});
            setState({});
            setSellingPrices({});
            fetchProfits()
            setCart([]);
            setMsg({ msg: '✅ Sale Posted!', state: 'success' });
        } catch (error: any) {
            console.log(error.message);
            setMsg({ msg: error.message || '❌ Could not add product.', state: 'error' });
        }
    };

    const handleAddToCart = async (product: ProductItem) => {
        const qty = parseInt(quantities[product.id]) || 0;
        const customPrice = parseFloat(sellingPrices[product.id]) || product.price;

        if (qty <= 0) {
            setMsg({ msg: 'Please enter a valid quantity.!', state: 'error' });
            return;
        }

        if (qty > product.quantity) {
            setQuantities((prev) => ({ ...prev, [product.id]: "" }));
            setMsg({ msg: 'Quantity exceeds available stock.!', state: 'error' });
            return;
        }

        setCart((prevCart: any) => {
            const existing = prevCart.find((item: any) => item.id === product.id);
            if (existing) {
                return prevCart.map((item: any) =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + qty,
                            price: customPrice,
                        }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity: qty, price: customPrice }];
            }
        });

        setBatchVisible((prev) => ({ ...prev, [product.id]: false }));
        setQuantities((prev) => ({ ...prev, [product.id]: '' }));
        setSellingPrices((prev) => ({ ...prev, [product.id]: '' }));
        setState((prev) => ({ ...prev, [product.id]: true }));
    };

    useEffect(() => {
        if (msg.msg) {
            const timer = setTimeout(() => {
                setMsg({ msg: "", state: "" });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [msg.msg]);

    useEffect(() => {

        fetchProfits()
    }, []);
    const total = cart.reduce((sum, item: any) => sum + item.quantity * item.price, 0);

    const renderItem = ({ item }: { item: ProductItem }) => (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="bg-white mx-4 my-2 p-4 rounded-2xl shadow-md">
                <View className="flex-row justify-between items-center mb-2">
                    <TouchableOpacity
                        onPress={() => {
                            const currentQty = parseInt(quantities[item.id] || '0', 10);
                            setQuantities((prev) => ({ ...prev, [item.id]: (currentQty + 1).toString() }));
                            setState((prev) => ({ ...prev, [item.id]: false }));
                        }}
                        className="px-2 h-12 flex items-center justify-center mx-1 rounded-sm"
                    >
                        <Text className="text-lg font-bold text-gray-900">{item.product_name}</Text>
                    </TouchableOpacity>
                    <Text className="text-sm text-gray-500">{item.quantity} {item.quantity !== 1 ? 'pcs' : 'pc'} in stock</Text>
                </View>

                {item.description ? (
                    <Text className="text-sm text-gray-500 mb-3">{item.description}</Text>
                ) : null}

                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center space-x-2">
                        <TouchableOpacity
                            onPress={() => {
                                const currentQty = parseInt(quantities[item.id] || '0', 10);
                                if (currentQty > 0) {
                                    setQuantities((prev) => ({ ...prev, [item.id]: (currentQty - 1).toString() }));
                                    setState((prev) => ({ ...prev, [item.id]: false }));
                                }
                            }}
                            className="bg-gray-200 px-2 h-12 flex items-center justify-center mx-1 w-12 rounded-sm"
                        >
                            <Text className="text-xl font-bold text-gray-600">−</Text>
                        </TouchableOpacity>

                        <TextInput
                            className="w-12 text-center text-base font-semibold border border-gray-300 rounded-md px-1"
                            keyboardType="numeric"
                            value={quantities[item.id] || '0'}
                            onChangeText={(text) => setQuantities((prev) => ({ ...prev, [item.id]: text }))}
                        />

                        <TouchableOpacity
                            onPress={() => {
                                const currentQty = parseInt(quantities[item.id] || '0', 10);
                                setQuantities((prev) => ({ ...prev, [item.id]: (currentQty + 1).toString() }));
                                setState((prev) => ({ ...prev, [item.id]: false }));
                            }}
                            className="bg-gray-200 px-2 h-12 flex items-center justify-center mx-1 w-12 rounded-sm"
                        >
                            <Text className="text-xl font-bold text-gray-600">+</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center space-x-2">
                        <Text className="text-sm text-gray-600">Price:</Text>
                        <TextInput
                            className="w-24 text-center text-base border border-gray-300 rounded-md px-2"
                            keyboardType="numeric"
                            placeholder="Selling Price"
                            value={sellingPrices[item.id] !== undefined ? sellingPrices[item.id] : item.price.toString()}
                            onChangeText={(text) => setSellingPrices((prev) => ({ ...prev, [item.id]: text }))}
                        />
                    </View>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text className="text-green-700 font-bold text-base">Default: Ksh {item.price.toFixed(2)}</Text>

                    {state[item.id] ? (
                        <Icon name="cart-arrow-down" color="#16a34a" size={22} />
                    ) : (
                        <TouchableOpacity
                            onPress={() => handleAddToCart(item)}
                            className="bg-green-600 px-5 py-3 rounded-md"
                        >
                            <Text className="text-white font-bold text-base">Add to Cart</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );

    const filtered = products.filter((item) =>
        item.product_name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-slate-900"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <PageHeader component={() =>
                <View className='flex items-center flex-row justify-between'>
                    <View className='w-3/4'>
                        <SearchBar white placeholder="search for a Product" />
                    </View>
                    <View className='w-1/4 flex items-center justify-center '>
                        <Text className='font-bold text-white'>{datasales?.total_sales_revenue?.toFixed(2)}/-</Text>
                    </View>

                </View>

            } />

            {loading ? (
                <SkeletonList />
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: cart.length > 0 ? 120 : 20 }}
                    keyExtractor={(item) => item.id.toString()}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {msg.msg && <Toast msg={msg.msg} state={msg.state} />}

            {cart.length > 0 && (
                <View className="absolute bottom-0 left-0 right-10 dark:bg-transparent w-full bg-slate-800 p-4 border-t border-gray-200 dark:border-slate-700 shadow-md">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <Text className="text-lg font-bold dark:text-slate-900 text-white">
                                Cart Total: Ksh {total.toFixed(2)}
                            </Text>
                            <View className="bg-green-600 rounded-full w-6 h-6 items-center justify-center ml-2">
                                <Text className="text-white text-xs font-bold">{cart.length}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            className="mt-2 bg-slate-500 rounded p-3 flex-row justify-center items-center"
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
                setModalVisible={setModalVisible}
            />
        </KeyboardAvoidingView>
    );
};

export default SalesScreen;
