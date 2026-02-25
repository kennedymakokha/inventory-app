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
    StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Camera, CameraType } from 'react-native-camera-kit';
import { getProducts } from '../../services/product.service';
import { getDBConnection } from '../../services/db-service';
import { DataSales, ProductItem } from '../../../models';
import CheckoutModal from './components/checkout';
import { createSalesTable, fetchCumulativeProfit, finalizeSale } from '../../services/sales.service';
import Toast from '../../components/Toast';
import { useSearch } from '../../context/searchContext';
import { useSettings } from '../../context/SettingsContext';
import { SkeletonList } from './components/skeleton';
import PageHeader from '../../components/pageHeader';
import SearchBar from '../../components/searchBar';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Theme } from '../../utils/theme';

const SalesScreen = () => {
    const { isScanToCartEnabled, isDarkMode } = useSettings();
    const { query } = useSearch();

    const [products, setProducts] = useState<ProductItem[]>([]);
    const [cart, setCart] = useState<ProductItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [sellingPrices, setSellingPrices] = useState<Record<string, string>>({});
    const [state, setState] = useState<Record<string, boolean>>({});
    const [datasales, setdataSales] = useState<DataSales | null>(null);

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
            await finalizeSale(db, cart);
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className={`${theme.card} mx-4 my-2 p-4 rounded-3xl shadow-sm border ${theme.border}`}>
                <View className="flex-row justify-between items-center mb-1">
                    <Text className={`text-lg font-bold ${theme.text}`}>{item.product_name}</Text>
                    <Text className={`text-xs px-2 py-1 rounded-full ${item.quantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.quantity} in stock
                    </Text>
                </View>

                {item.barcode ? <Text className="text-xs text-blue-500 mb-2 font-mono">{item.barcode}</Text> : null}

                <View className="flex-row items-center justify-between mb-4 mt-2">
                    <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                        <TouchableOpacity
                            onPress={() => {
                                const current = parseInt(quantities[item.id] || '0');
                                if (current > 0) setQuantities(prev => ({ ...prev, [item.id]: (current - 1).toString() }));
                                setState(prev => ({ ...prev, [item.id]: false }));
                            }}
                            className="w-10 h-10 items-center justify-center"
                        >
                            <Icon name="minus" size={12} color={isDarkMode ? "#fff" : "#000"} />
                        </TouchableOpacity>
                        <TextInput
                            className={`w-12 text-center font-bold ${theme.text}`}
                            keyboardType="numeric"
                            value={quantities[item.id] || '0'}
                            onChangeText={(text) => {
                                setQuantities((prev) => ({ ...prev, [item.id]: text }));
                                setState(prev => ({ ...prev, [item.id]: false }));
                            }}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                const current = parseInt(quantities[item.id] || '0');
                                setQuantities(prev => ({ ...prev, [item.id]: (current + 1).toString() }));
                                setState(prev => ({ ...prev, [item.id]: false }));
                            }}
                            className="w-10 h-10 items-center justify-center"
                        >
                            <Icon name="plus" size={12} color={isDarkMode ? "#fff" : "#000"} />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-3 h-12">
                        <Text className={theme.subText}>Ksh </Text>
                        <TextInput
                            className={`w-20 font-bold ${theme.text}`}
                            keyboardType="numeric"
                            value={sellingPrices[item.id] !== undefined ? sellingPrices[item.id] : item.price.toString()}
                            onChangeText={(text) => setSellingPrices((prev) => ({ ...prev, [item.id]: text }))}
                        />
                    </View>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text className="text-green-600 font-bold">Base: {item.price.toFixed(2)}</Text>
                    {state[item.id] ? (
                        <View className="bg-green-100 p-2 rounded-full">
                            <Icon name="check-circle" color="#16a34a" size={24} />
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => handleAddToCart(item)} className="bg-blue-600 px-6 py-3 rounded-2xl shadow-blue-500/50 shadow-lg">
                            <Text className="text-white font-bold">Add to Cart</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );

    const filtered = products.filter((item) =>
        item.product_name.toLowerCase().includes(query.toLowerCase()) ||
        (item.barcode && item.barcode.includes(query))
    );

    return (
        <KeyboardAvoidingView className={`flex-1 ${theme.bg}`} behavior={Platform.OS === "ios" ? "padding" : undefined}>

            <Modal visible={isScannerOpen} animationType="slide">
                <View className="flex-1 bg-black">
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

            {loading ? <SkeletonList /> : (
                <FlatList
                    data={filtered}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: cart.length > 0 ? 150 : 30 }}
                    keyExtractor={(item) => item.id.toString()}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {msg.msg && <Toast msg={msg.msg} state={msg.state} />}

            {cart.length > 0 && (
                <View className="absolute bottom-6 left-4 right-4 bg-slate-800 p-5 rounded-3xl shadow-2xl border border-slate-700">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-400 text-xs uppercase font-bold tracking-widest">Total Amount</Text>
                            <Text className="text-2xl font-black text-white">Ksh {total.toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-green-500 px-8 py-4 rounded-2xl">
                            <Text className="text-slate-900 font-black text-lg">CHECKOUT ({cart.length})</Text>
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