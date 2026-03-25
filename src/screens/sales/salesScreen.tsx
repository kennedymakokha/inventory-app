import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ProductItem, DataSales } from '../../../models';
import CheckoutModal from './components/checkout';
import Toast from '../../components/Toast';
import { useSearch } from '../../context/searchContext';
import PageHeader from '../../components/pageHeader';
import SearchBar from '../../components/searchBar';

import { finalizeSale } from '../../services/sales.service';

import { useTheme } from '../../context/themeContext';
import { useSettings } from '../../context/SettingsContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from '../../../store';
import { addToCart, clearCart } from '../../features/cartSlice';


const LIMIT = 30;

const SalesScreen: React.FC = ({ route, navigation }: any) => {

    const { items: cart } = useSelector((state: RootState) => state.cart);
    const dispatch = useDispatch();
    const { category } = route.params;
    const { user } = useSelector((state: any) => state.auth);
    const { business } = user;
    const { isScanToCartEnabled } = useSettings();
    const { query } = useSearch();
    const { colors } = useTheme();

    const [products, setProducts] = useState<ProductItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<any>({ msg: "", state: "", small: false });
    const [page, setPage] = useState(0);
    const [datasales, setdataSales] = useState<DataSales | null>(null);

    // Local state for prices 
    const [sellingPrices, setSellingPrices] = useState<Record<string, string>>({});

    /* ---------------- LOAD PRODUCTS ---------------- */
    const loadData = async (pageNumber = 0, append = false) => {
        setLoading(true);
        try {
            const db = await getDBConnection();
            const offset = pageNumber * LIMIT;
            const fetchedProducts = await getProductsByCategoryName(db, category, LIMIT, offset);
            const existingPrices: Record<string, string> = {};
            fetchedProducts.forEach(p => {
                const inCart = cart.find(c => c.id === p.id);
                if (inCart) {
                    existingPrices[p.id] = inCart.price.toString();
                }
            });
            setSellingPrices(prev => ({ ...prev, ...existingPrices }));

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
    useFocusEffect(
        useCallback(() => {
            // Re-sync local price state with whatever is actually in the cart
            const existingPrices: Record<string, string> = {};
            cart.forEach((item: any) => {
                existingPrices[item.id] = item.price.toString();
            });
            setSellingPrices(prev => ({ ...prev, ...existingPrices }));
        }, [cart])
    );
    /* ---------------- ADD TO CART ---------------- */
    const handleAddToCart = (product: ProductItem, newQty: number) => {
        if (newQty > product.quantity) {
            setMsg({ msg: "Quantity exceeds available stock!", state: "error" });
            return;
        }

        const customPrice = parseFloat(sellingPrices[product.id]) || product.price;
        dispatch(addToCart({ product, quantity: newQty, price: customPrice }));

        if (newQty > 0) {
            setMsg({ msg: `${product.product_name} updated`, state: "success", small: true });
        }
    };

    /* ---------------- BARCODE SCANNER ---------------- */
    const handleBarcodeScanned = (event: any) => {
        const code = event.nativeEvent.codeStringValue;
        if (!code) return;

        const foundProduct = products.find(p => p.barcode === code);
        if (!foundProduct) {
            setMsg({ msg: 'Product not in this category', state: 'error' });
            return;
        }

        const cartItem = cart.find(c => c.id === foundProduct.id);
        const currentQty = cartItem ? cartItem.quantity : 0;

        if (isScanToCartEnabled) {
            handleAddToCart(foundProduct, currentQty + 1);
            setIsScannerOpen(false);
        } else {
            setMsg({ msg: `🔍 Found: ${foundProduct.product_name}`, state: 'success' });
            setIsScannerOpen(false);
        }
    };

    /* ---------------- POST SALE ---------------- */
    const PostSale = async (receiptNo: any, method: string, phone?: string, paidAmount?: string, mpesaData?: any,
        paidCash?: any,
        paidMpesa?: any,
        // 
    ) => {
        try {
            const db = await getDBConnection();
            await finalizeSale(db, cart, { receiptNo, mpesaAmount: paidMpesa, cashAmount: paidCash, method, phone, business_id: business._id, createdBy: user.user_id, mpesaData });
            await loadData();
            setModalVisible(false);
            setSellingPrices({});
            clearCart();
            setMsg({ msg: 'Sale Posted Successfully!', state: 'success' });
        } catch (error: any) {
            setMsg({ msg: error.message || 'Sale failed.', state: 'error' });
        }
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.price, 0), [cart]);

    /* ---------------- RENDER ITEM ---------------- */
    const renderItem = ({ item }: { item: ProductItem }) => {
        // ALWAYS check global cart for the latest quantity
        const cartItem = cart.find(c => String(c.id) === String(item.id));
        const currentQty = cartItem ? cartItem.quantity : 0;
        const stockColor = item.quantity > 5 ? colors.success : colors.danger;

        return (
            <Pressable onPress={Keyboard.dismiss}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.productName, { color: colors.text }]}>{item.product_name}</Text>
                        <View style={[styles.stockBadge, { backgroundColor: stockColor }]}>
                            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{item.quantity} IN STOCK</Text>
                        </View>
                    </View>

                    {item.barcode && <Text style={[styles.barcodeText, { color: colors.subText }]}>{item.barcode}</Text>}

                    <View style={styles.inputRow}>
                        {/* Quantity Controls */}
                        <View style={[styles.qtyContainer, { backgroundColor: colors.inputBg }]}>
                            <TouchableOpacity
                                onPress={() => handleAddToCart(item, Math.max(0, currentQty - 1))}
                                style={styles.qtyBtn}
                            >
                                <Icon name="minus" size={12} color={colors.text} />
                            </TouchableOpacity>

                            <TextInput
                                style={[styles.qtyInput, { color: colors.text }]}
                                keyboardType="numeric"
                                value={currentQty.toString()}
                                onChangeText={text => handleAddToCart(item, parseInt(text) || 0)}
                            />

                            <TouchableOpacity
                                onPress={() => handleAddToCart(item, currentQty + 1)}
                                style={styles.qtyBtn}
                            >
                                <Icon name="plus" size={12} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Price Override */}
                        <View style={[styles.priceInputContainer, { backgroundColor: colors.inputBg }]}>
                            <Text style={{ color: colors.subText, fontSize: 12 }}>Ksh </Text>
                            <TextInput
                                style={[styles.priceInput, { color: colors.text }]}
                                keyboardType="numeric"
                                // FIX: Look at Cart First, then Local State, then Database Price
                                value={
                                    cart.find(c => c.id === item.id)?.price.toString() ||
                                    sellingPrices[item.id] ||
                                    item.price.toString()
                                }
                                onChangeText={text => {
                                    setSellingPrices(prev => ({ ...prev, [item.id]: text }));
                                    // If it's already in the cart, update the cart price immediately
                                    const currentQty = cart.find(c => c.id === item.id)?.quantity || 0;
                                    if (currentQty > 0) {
                                        addToCart(item, currentQty, parseFloat(text) || item.price);
                                    }
                                }}
                            />
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <Text style={{ color: colors.success, fontWeight: "bold" }}>
                            Unit: {item.price?.toFixed(2)}
                        </Text>

                        <TouchableOpacity
                            onPress={() => handleAddToCart(item, currentQty + 1)}
                            style={[styles.addBtn, { backgroundColor: colors.primaryDark }]}
                        >
                            <Text style={styles.addBtnText}>{currentQty > 0 ? "Add More" : "Add to Cart"}</Text>
                            {currentQty > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{currentQty}</Text>
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
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Modal visible={isScannerOpen} animationType="slide">
                <View style={{ flex: 1 }}>
                    <Camera
                        style={{ flex: 1 }}
                        scanBarcode={true}
                        onReadCode={handleBarcodeScanned}
                        showFrame={true}
                        laserColor={colors.success}
                    />
                    <TouchableOpacity onPress={() => setIsScannerOpen(false)} style={styles.closeScanner}>
                        <Icon name="times" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </Modal>

            <PageHeader component={() =>
                <View style={styles.headerContent}>
                    <View style={{ width: '60%' }}>
                        <SearchBar white placeholder="Search inventory..." />
                    </View>
                    <TouchableOpacity onPress={() => setIsScannerOpen(true)} style={styles.headerIconBtn}>
                        <Icon name="barcode" size={20} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerRevenue}>
                        <Text style={styles.revenueLabel}>REVENUE</Text>
                        <Text style={styles.revenueValue}>{datasales?.total_sales_revenue?.toFixed(0) || 0}/-</Text>
                    </View>
                </View>
            } />

            {msg.msg ? <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} small={msg.small} /> : null}

            <FlatList
                data={filtered}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: cart.length > 0 ? 160 : 40, paddingTop: 10 }}
                keyExtractor={item => item.id.toString()}
                keyboardShouldPersistTaps="handled"
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
            />

            {cart.length > 0 && (
                <View style={[styles.checkoutBar, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                    <View style={styles.checkoutInfo}>
                        <Text style={[styles.totalLabel, { color: colors.subText }]}>TOTAL AMOUNT</Text>
                        <Text style={[styles.totalValue, { color: colors.text }]}>Ksh {total.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}
                        style={styles.checkoutBtn}
                    >
                        <Text style={styles.checkoutBtnText}>CHECKOUT ({cart.length})</Text>
                    </TouchableOpacity>
                </View>
            )}

            <CheckoutModal
                setMsg={setMsg}
                msg={msg}
                cartItems={cart}
                clearCart={() => dispatch(clearCart())}
                PostLocally={PostSale}
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
            />
        </KeyboardAvoidingView>
    );
};

// ... Styles remain the same

const styles = StyleSheet.create({
    card: { marginHorizontal: 16, marginVertical: 8, padding: 16, borderRadius: 16, borderWidth: 1 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    productName: { fontSize: 16, fontWeight: "bold", flex: 1 },
    stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    barcodeText: { fontSize: 11, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    inputRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    qtyContainer: { flexDirection: "row", borderRadius: 12, alignItems: "center", padding: 2 },
    qtyBtn: { width: 35, height: 35, justifyContent: "center", alignItems: "center" },
    qtyInput: { textAlign: "center", fontWeight: "bold", width: 45, fontSize: 16 },
    priceInputContainer: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 10, height: 40 },
    priceInput: { fontWeight: "bold", width: 70, fontSize: 14 },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    addBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexDirection: "row", alignItems: "center" },
    addBtnText: { color: "white", fontWeight: "bold", fontSize: 13 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    badgeText: { color: "white", fontWeight: "bold", fontSize: 11 },
    checkoutBar: { position: 'absolute', bottom: 20, left: 16, right: 16, padding: 16, borderRadius: 20, borderWeight: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
    checkoutInfo: { flex: 1 },
    totalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    totalValue: { fontSize: 20, fontWeight: '900' },
    checkoutBtn: { backgroundColor: '#22c55e', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    checkoutBtnText: { color: 'white', fontWeight: '900', fontSize: 14 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
    headerIconBtn: { backgroundColor: 'rgba(255,255,255,0.15)', p: 10, borderRadius: 12, padding: 10 },
    headerRevenue: { alignItems: 'flex-end' },
    revenueLabel: { color: 'white', fontSize: 10, opacity: 0.7, fontWeight: 'bold' },
    revenueValue: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    closeScanner: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, borderRadius: 40 }
});

export default SalesScreen;