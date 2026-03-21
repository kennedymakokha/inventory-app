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
    Pressable,
    StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Camera } from 'react-native-camera-kit';
import { getProductsByCategoryName } from '../../services/product.service';
import { getDBConnection } from '../../services/db-service';
import { CartItem, DataSales, ProductItem } from '../../../models';
import CheckoutModal from './components/checkout';
import Toast from '../../components/Toast';
import { useSearch } from '../../context/searchContext';

import PageHeader from '../../components/pageHeader';
import SearchBar from '../../components/searchBar';

import { useCart } from '../../context/CartContext';
import { finalizeSale } from '../../services/sales.service';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/themeContext';
import { useSettings } from '../../context/SettingsContext';

const LIMIT = 30;

const SalesScreen: React.FC = ({ route, navigation }: any) => {
    const { category } = route.params;
    const { user } = useSelector((state: any) => state.auth);

    const { business } = user;
    const { isScanToCartEnabled } = useSettings();
    const { query } = useSearch();
    const { colors, isDarkMode } = useTheme();

    const [products, setProducts] = useState<ProductItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [sellingPrices, setSellingPrices] = useState<Record<string, string>>({});
    const [state, setState] = useState<Record<string, boolean>>({});
    const [page, setPage] = useState(0);
    const [datasales, setdataSales] = useState<DataSales | null>(null);

    const { cart, addToCart, clearCart } = useCart();

    /* ---------------- LOAD PRODUCTS ---------------- */
    const loadData = async (pageNumber = 0, append = false) => {
        setLoading(true);
        try {
            const db = await getDBConnection();
            const offset = pageNumber * LIMIT;
            const fetchedProducts = await getProductsByCategoryName(
                db,
                category,
                LIMIT,
                offset
            );

            if (append) setProducts(prev => [...prev, ...fetchedProducts]);
            else setProducts(fetchedProducts);
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        setPage(0);
        loadData(0);
    }, [category]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage, true);
    };

    /* ---------------- UNIFIED ADD TO CART ---------------- */
    const handleIncrementAddToCart = (product: ProductItem) => {
        const currentQty = parseInt(quantities[product.id] || '0');
        const newQty = currentQty + 1;

        if (newQty > product.quantity) {
            setMsg({ msg: 'Quantity exceeds available stock!', state: 'error' });
            return;
        }

        setQuantities(prev => ({ ...prev, [product.id]: newQty.toString() }));

        const customPrice = parseFloat(sellingPrices[product.id]) || product.price;
        addToCart(product, newQty, customPrice);

        setState(prev => ({ ...prev, [product.id]: true }));
    };

    /* ---------------- BARCODE SCANNER ---------------- */
    const handleBarcodeScanned = (event: any) => {
        const code = event.nativeEvent.codeStringValue;
        if (!code) return;

        const foundProduct = products.find(p => p.barcode === code);
        if (!foundProduct) {
            setMsg({ msg: 'Barcode not recognized', state: 'error' });
            return;
        }

        if (isScanToCartEnabled) {
            if (foundProduct.quantity > 0) {
                addToCart(foundProduct, 1, foundProduct.price);
                setMsg({ msg: ` ${foundProduct.product_name} added to cart`, state: 'success' });
            } else setMsg({ msg: 'Item out of stock', state: 'error' });
            setIsScannerOpen(false);
        } else {
            setMsg({ msg: `🔍 Found: ${foundProduct.product_name}`, state: 'success' });
            setIsScannerOpen(false);
        }
    };

    /* ---------------- POST SALE ---------------- */
    const PostSale = async (receiptNo: any, method: string, phone?: string, paidAmount?: string) => {

        console.log("RECIT", receiptNo)
        try {
            const db = await getDBConnection();
            await finalizeSale(db, cart, { receiptNo, method, phone, paidAmount, business_id: business._id, createdBy: user.user_id });
            await loadData();
            setModalVisible(false);
            setQuantities({});
            setState({});
            setSellingPrices({});
            clearCart();
            setMsg({ msg: 'Sale Posted Successfully!', state: 'success' });
        } catch (error: any) {
            setMsg({ msg: error.message || 'Sale failed.', state: 'error' });
        }
    };

    const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

    /* ---------------- RENDER ITEM ---------------- */
    const renderItem = ({ item }: { item: ProductItem }) => {
        const currentQty = parseInt(quantities[item.id] || '0');

        return (
            <Pressable onPress={Keyboard.dismiss}>
                <View style={{ backgroundColor: colors.card, borderColor: colors.border }}
                    className="mx-4 my-2 p-4 rounded-xl border"
                >
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                            {item.product_name}
                        </Text>
                        <View style={{ backgroundColor: item.quantity > 5 ? '#064e3b' : '#7f1d1d' }}
                            className="px-2 py-1 rounded-full">
                            <Text style={{ color: '#fff', fontSize: 12 }}>{item.quantity} in stock</Text>
                        </View>
                    </View>

                    {item.barcode && (
                        <Text className="text-xs mb-2 font-mono" style={{ color: colors.subText }}>
                            {item.barcode}
                        </Text>
                    )}

                    <View className="flex-row items-center justify-between mb-4 mt-2">
                        {/* Quantity Input */}
                        <View style={{ backgroundColor: colors.inputBg }} className="flex-row items-center rounded-xl p-1">
                            <TouchableOpacity
                                onPress={() => {
                                    if (currentQty > 0) {
                                        const newQty = currentQty - 1;
                                        setQuantities(prev => ({ ...prev, [item.id]: newQty.toString() }));
                                        addToCart(item, newQty, parseFloat(sellingPrices[item.id]) || item.price);
                                        setState(prev => ({ ...prev, [item.id]: false }));
                                    }
                                }}
                                className="w-10 h-10 items-center justify-center">
                                <Icon name="minus" size={12} color={colors.text} />
                            </TouchableOpacity>

                            <TextInput
                                className="w-12 text-center font-bold"
                                style={{ color: colors.text }}
                                keyboardType="numeric"
                                value={quantities[item.id] || '0'}
                                onChangeText={text => {
                                    const val = Math.max(0, parseInt(text) || 0);
                                    setQuantities(prev => ({ ...prev, [item.id]: val.toString() }));
                                    addToCart(item, val, parseFloat(sellingPrices[item.id]) || item.price);
                                    setState(prev => ({ ...prev, [item.id]: false }));
                                }}
                            />
                        </View>

                        {/* Selling Price */}
                        <View style={{ backgroundColor: colors.inputBg }} className="flex-row items-center rounded-xl px-3 h-12">
                            <Text style={{ color: colors.subText }}>Ksh </Text>
                            <TextInput
                                className="w-20 font-bold"
                                style={{ color: colors.text }}
                                keyboardType="numeric"
                                value={sellingPrices[item.id] ?? item.price.toString()}
                                onChangeText={text => setSellingPrices(prev => ({ ...prev, [item.id]: text }))}
                            />
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center">
                        <Text className="font-bold" style={{ color: '#16a34a' }}>Base: {item.price?.toFixed(2)}</Text>

                        {/* Unified Add to Cart */}
                        <TouchableOpacity
                            onPress={() => handleIncrementAddToCart(item)}
                            className="bg-blue-600 px-6 py-3 rounded-sm flex-row items-center"
                        >
                            <Text className="text-white font-bold mr-2">Add to Cart</Text>
                            {currentQty > 0 && (
                                <View className="bg-white px-2 py-0.5 rounded-full">
                                    <Text className="text-blue-600 font-bold text-xs">{currentQty}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        );
    };

    const filtered = products.filter(item =>
        item.product_name?.toLowerCase().includes(query?.toLowerCase()) ||
        (item.barcode && item.barcode.includes(query))
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background, paddingTop: 16 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Modal visible={isScannerOpen} animationType="slide">
                <View className="flex-1">
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

            {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}

            <FlatList
                data={filtered}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: cart.length > 0 ? 150 : 30 }}
                keyExtractor={item => item.id.toString()}
                keyboardShouldPersistTaps="handled"
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
            />

            {cart.length > 0 && (
                <View className="absolute bottom-6 left-4 right-4 p-5 rounded-sm border"
                    style={{ backgroundColor: colors.elevated, borderColor: colors.border }}>
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-xs uppercase font-bold tracking-widest" style={{ color: colors.subText }}>
                                Total Amount
                            </Text>
                            <Text className="text-2xl font-black" style={{ color: colors.text }}>
                                Ksh {total.toLocaleString()}
                            </Text>
                        </View>

                        <TouchableOpacity onPress={() => setModalVisible(true)}
                            className="bg-green-500 px-8 py-4 rounded-sm">
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
                clearCart={clearCart}
                PostLocally={PostSale}
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
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