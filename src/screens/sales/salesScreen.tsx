import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    StyleSheet,
    Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Camera, CameraType } from 'react-native-camera-kit';
import { getProducts } from '../../services/product.service';
import { getDBConnection } from '../../services/db-service';
import { CartItem, DataSales, ProductItem } from '../../../models';
import CheckoutModal from './components/checkout';
import { createSalesTable, fetchCumulativeProfit, fetchSales, finalizeSale } from '../../services/sales.service';
import Toast from '../../components/Toast';
import { useSearch } from '../../context/searchContext';
import { useSettings } from '../../context/SettingsContext';
import { SkeletonList } from './components/skeleton';
import PageHeader from '../../components/pageHeader';
import SearchBar from '../../components/searchBar';
import { Theme } from '../../utils/theme';
import { useCreateSaleMutation } from '../../services/salesApi';

const SalesScreen = () => {
    const { isScanToCartEnabled, isDarkMode } = useSettings();
    const { query } = useSearch();
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [sellingPrices, setSellingPrices] = useState<Record<string, string>>({});
    const [state, setState] = useState<Record<string, boolean>>({});
    const [datasales, setdataSales] = useState<DataSales | null>(null);
    const [postSale] = useCreateSaleMutation()
    const theme = isDarkMode ? Theme.dark : Theme.light;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const db = await getDBConnection();
        const fetchedProducts: ProductItem[] = await getProducts(db);
        setProducts(fetchedProducts);
        fetchProfits();
        setLoading(false);
    };

    const fetchProfits = async () => {
        const db = await getDBConnection();
        fetchCumulativeProfit(db, "today", (data: any) => {
            setdataSales(data);
        });
    };

    const handleBarcodeScanned = (event: any) => {
        const code = event.nativeEvent.codeStringValue;
        if (!code) return;

        const foundProduct = products.find(p => p.barcode === code);

        if (foundProduct) {
            if (isScanToCartEnabled) {
                if (foundProduct.quantity > 0) {
                    // Direct Add logic
                    const customPrice = foundProduct.price;
                    updateCartUI(foundProduct, 1, customPrice);
                    setMsg({ msg: `✅ ${foundProduct.product_name} added to cart`, state: 'success' });
                    setIsScannerOpen(false);
                } else {
                    setMsg({ msg: '❌ Item out of stock', state: 'error' });
                }
            } else {
                // Focus/Manual logic: It effectively acts as a filter
                setMsg({ msg: `🔍 Found: ${foundProduct.product_name}`, state: 'success' });
                setIsScannerOpen(false);
            }
        } else {
            setMsg({ msg: '❌ Barcode not recognized', state: 'error' });
        }
    };

    const updateCartUI = (product: ProductItem, qty: number, price: number) => {
        setCart((prevCart: any) => {
            const existing = prevCart.find((item: any) => item.id === product.id);
            if (existing) {
                return prevCart.map((item: any) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + qty, price } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: qty, price }];
            }
        });
        setState((prev) => ({ ...prev, [product.id]: true }));
    };

    const handleAddToCart = (product: ProductItem) => {
        const qty = parseInt(quantities[product.id]) || 0;
        const customPrice = parseFloat(sellingPrices[product.id]) || product.price;

        if (qty <= 0) {
            setMsg({ msg: 'Please enter a valid quantity!', state: 'error' });
            return;
        }

        if (qty > product.quantity) {
            setMsg({ msg: 'Quantity exceeds available stock!', state: 'error' });
            return;
        }

        updateCartUI(product, qty, customPrice);
        setQuantities((prev) => ({ ...prev, [product.id]: '' }));
        setSellingPrices((prev) => ({ ...prev, [product.id]: '' }));
    };

    const PostSale = async () => {
        try {
            const db = await getDBConnection();
            await createSalesTable(db);
            await finalizeSale(db, cart, postSale);
            await loadData();
            setModalVisible(false);
            setQuantities({});
            setState({});
            setSellingPrices({});
            setCart([]);
            setMsg({ msg: '✅ Sale Posted Successfully!', state: 'success' });
        } catch (error: any) {
            setMsg({ msg: error.message || '❌ Sale failed.', state: 'error' });
        }
    };

    const total = cart.reduce((sum, item: any) => sum + item.quantity * item.price, 0);

    const renderItem = ({ item }: { item: ProductItem }) => (
        <Pressable onPress={Keyboard.dismiss}>
            <View
                style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                }}
                className="mx-4 my-2 p-4 rounded-xl border"
            >
                {/* Header */}
                <View className="flex-row justify-between items-center mb-1">
                    <Text
                        className="text-lg font-bold"
                        style={{ color: theme.text }}
                    >
                        {item.product_name}
                    </Text>

                    <View
                        style={{
                            backgroundColor:
                                item.quantity > 5 ? '#064e3b' : '#7f1d1d',
                        }}
                        className="px-2 py-1 rounded-full"
                    >
                        <Text style={{ color: '#fff', fontSize: 12 }}>
                            {item.quantity} in stock
                        </Text>
                    </View>
                </View>

                {/* Barcode */}
                {item.barcode ? (
                    <Text
                        className="text-xs mb-2 font-mono"
                        style={{ color: theme.subText }}
                    >
                        {item.barcode}
                    </Text>
                ) : null}

                {/* Controls */}
                <View className="flex-row items-center justify-between mb-4 mt-2">
                    {/* Quantity */}
                    <View
                        style={{ backgroundColor: theme.inputBg }}
                        className="flex-row items-center rounded-xl p-1"
                    >
                        <TouchableOpacity
                            onPress={() => {
                                const current = parseInt(quantities[item.id] || '0');
                                if (current > 0)
                                    setQuantities(prev => ({
                                        ...prev,
                                        [item.id]: (current - 1).toString(),
                                    }));
                                setState(prev => ({ ...prev, [item.id]: false }));
                            }}
                            className="w-10 h-10 items-center justify-center"
                        >
                            <Icon name="minus" size={12} color={theme.text} />
                        </TouchableOpacity>

                        <TextInput
                            className="w-12 text-center font-bold"
                            style={{ color: theme.text }}
                            keyboardType="numeric"
                            value={quantities[item.id] || '0'}
                            onChangeText={(text) => {
                                setQuantities(prev => ({ ...prev, [item.id]: text }));
                                setState(prev => ({ ...prev, [item.id]: false }));
                            }}
                        />

                        <TouchableOpacity
                            onPress={() => {
                                const current = parseInt(quantities[item.id] || '0');
                                setQuantities(prev => ({
                                    ...prev,
                                    [item.id]: (current + 1).toString(),
                                }));
                                setState(prev => ({ ...prev, [item.id]: false }));
                            }}
                            className="w-10 h-10 items-center justify-center"
                        >
                            <Icon name="plus" size={12} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Price */}
                    <View
                        style={{ backgroundColor: theme.inputBg }}
                        className="flex-row items-center rounded-xl px-3 h-12"
                    >
                        <Text style={{ color: theme.subText }}>Ksh </Text>
                        <TextInput
                            className="w-20 font-bold"
                            style={{ color: theme.text }}
                            keyboardType="numeric"
                            value={
                                sellingPrices[item.id] !== undefined
                                    ? sellingPrices[item.id]
                                    : item.price.toString()
                            }
                            onChangeText={(text) =>
                                setSellingPrices(prev => ({
                                    ...prev,
                                    [item.id]: text,
                                }))
                            }
                        />
                    </View>
                </View>

                {/* Footer */}
                <View className="flex-row justify-between items-center">
                    <Text
                        className="font-bold"
                        style={{ color: '#16a34a' }}
                    >
                        Base: {item?.price?.toFixed(2)}
                    </Text>

                    {state[item.id] ? (
                        <View className="bg-green-100 p-2 rounded-full">
                            <Icon name="check-circle" color="#16a34a" size={24} />
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handleAddToCart(item)}
                            className="bg-blue-600 px-6 py-3 rounded-2xl"
                        >
                            <Text className="text-white font-bold">
                                Add to Cart
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Pressable>
    );

    const filtered = products.filter((item) =>
        item.product_name.toLowerCase().includes(query.toLowerCase()) ||
        (item.barcode && item.barcode.includes(query))
    );
    const fetch = async () => {
        const db = await getDBConnection();
        fetchSales(db).then((data) => {
            // setdataSales(data)
            console.log(data)
        }).catch((err) => {
            console.log(err)
        }
        )
    }
    useEffect(() => {
        fetch();
    }, [])

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.background, paddingTop: 16 }}
            className={`flex-1 ${theme.background}`} behavior={Platform.OS === "ios" ? "padding" : undefined}>

            <Modal visible={isScannerOpen} animationType="slide">
                <View className="flex-1" >
                    <Camera
                        style={{ flex: 1 }}
                        scanBarcode={true}
                        onReadCode={handleBarcodeScanned}
                        showFrame={true}
                        laserColor="#22c55e"
                    />
                    <TouchableOpacity onPress={() => setIsScannerOpen(false)} style={styles.closeScanner}>
                        <Icon name="times" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </Modal>

            <PageHeader component={() =>
                <View className='flex items-center flex-row justify-between'>
                    <View className='w-3/5'>
                        <SearchBar white placeholder="Search inventory..." />
                    </View>
                    <TouchableOpacity onPress={() => setIsScannerOpen(true)} className="bg-white/20 p-3 rounded-xl">
                        <Icon name="barcode" size={20} color="white" />
                    </TouchableOpacity>
                    <View className='w-1/4 items-end'>
                        <Text className='font-bold text-white text-xs opacity-70'>TODAY</Text>
                        <Text className='font-bold text-white'>{datasales?.total_sales_revenue?.toFixed(0)}/-</Text>
                    </View>
                </View>
            } />

            {/* {loading ? <SkeletonList /> : ( */}
            <FlatList
                data={filtered}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: cart.length > 0 ? 150 : 30 }}
                keyExtractor={(item) => item.id.toString()}
                keyboardShouldPersistTaps="handled"
            />
            {/* )} */}

            {msg.msg && <Toast msg={msg.msg} state={msg.state} />}

            {cart.length > 0 && (
                <View
                    className="absolute bottom-6 left-4 right-4 p-5 rounded-3xl border"
                    style={{
                        backgroundColor: theme.elevated,
                        borderColor: theme.border,
                    }}
                >
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text
                                className="text-xs uppercase font-bold tracking-widest"
                                style={{ color: theme.subText }}
                            >
                                Total Amount
                            </Text>
                            <Text
                                className="text-2xl font-black"
                                style={{ color: theme.text }}
                            >
                                Ksh {total.toLocaleString()}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            className="bg-green-500 px-8 py-4 rounded-2xl"
                        >
                            <Text className="text-slate-900 font-black text-lg">
                                CHECKOUT ({cart.length})
                            </Text>
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
                isDarkMode={isDarkMode}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    closeScanner: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 20,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'white'
    }
});

export default SalesScreen;