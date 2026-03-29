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
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Camera } from 'react-native-camera-kit';
import { useSelector, useDispatch } from "react-redux";
import { useFocusEffect } from '@react-navigation/native';

// Services & Context
import { getProductsByCategoryName } from '../../services/product.service';
import { getDBConnection } from '../../services/db-service';
import { finalizeSale } from '../../services/sales.service';
import { useSearch } from '../../context/searchContext';
import { useTheme } from '../../context/themeContext';
import { useSettings } from '../../context/SettingsContext';
import { addToCart, clearCart } from '../../features/cartSlice';
import { RootState } from '../../../store';
import { ProductItem } from '../../../models';

// Components
import CheckoutModal from './components/checkout';
import Toast from '../../components/Toast';
import PageHeader from '../../components/pageHeader';
import SearchBar from '../../components/searchBar';

const LIMIT = 30;

const SalesScreen = ({ route, navigation }: any) => {
    const dispatch = useDispatch();
    const { category } = route.params;
    const { items: cart } = useSelector((state: RootState) => state.cart);
    const { user } = useSelector((state: any) => state.auth);
    const { colors } = useTheme();
    const { isScanToCartEnabled } = useSettings();
    const { query } = useSearch();

    const [products, setProducts] = useState<ProductItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [msg, setMsg] = useState<any>({ msg: "", state: "", small: false });
    const [sellingPrices, setSellingPrices] = useState<Record<string, string>>({});

    /* ---------------- DATA LOADING ---------------- */
    const loadData = useCallback(async (pageNumber = 0, append = false) => {
        if (pageNumber === 0) setLoading(true);
        try {
            const db = await getDBConnection();
            const offset = pageNumber * LIMIT;
            const fetched = await getProductsByCategoryName(db, category, LIMIT, offset);
            if (append) setProducts(prev => [...prev, ...fetched]);
            else setProducts(fetched);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        loadData(0);
    }, [loadData]);

    useFocusEffect(
        useCallback(() => {
            const prices: Record<string, string> = {};
            cart.forEach(item => { prices[item.id] = item.price.toString(); });
            setSellingPrices(prev => ({ ...prev, ...prices }));
        }, [cart])
    );

    /* ---------------- ACTIONS ---------------- */
    const handleAddToCart = (product: ProductItem, newQty: number, manualPrice?: number) => {
        if (newQty > product.quantity) {
            setMsg({ msg: "Insufficient stock!", state: "error", small: true });
            return;
        }
        const price = manualPrice ?? (parseFloat(sellingPrices[product.id]) || product.price);
        dispatch(addToCart({ product, quantity: newQty, price }));
    };

    const PostSale = async (receiptNo: any, method: string, phone?: string, paidCash?: any, paidMpesa?: any, mpesaData?: any, customerPin?: string) => {
        try {
            const db = await getDBConnection();
            await finalizeSale(db, cart, { 
                receiptNo, mpesaAmount: paidMpesa, cashAmount: paidCash, method, phone, customerPin,
                business_id: user.business._id, createdBy: user.user_id, mpesaData 
            });
            await loadData(0);
            setModalVisible(false);
            setSellingPrices({});
            dispatch(clearCart());
            setMsg({ msg: 'Sale Posted Successfully!', state: 'success' });
        } catch (error: any) {
            setMsg({ msg: error.message || 'Sale failed.', state: 'error' });
        }
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.price, 0), [cart]);

    /* ---------------- RENDER ---------------- */
    const renderItem = ({ item }: { item: ProductItem }) => {
        const cartItem = cart.find(c => String(c.id) === String(item.id));
        const currentQty = cartItem ? cartItem.quantity : 0;
        const stockColor = item.quantity > 5 ? '#22c55e' : colors.danger;
        const displayPrice = cartItem ? cartItem.price.toString() : (sellingPrices[item.id] || item.price.toString());

        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.productName, { color: colors.text }]}>{item.product_name}</Text>
                        <Text style={{ color: colors.subText, fontSize: 11 }}>{category}</Text>
                    </View>
                    <View style={[styles.stockBadge, { backgroundColor: stockColor + '20' }]}>
                        <Text style={{ color: stockColor, fontSize: 10, fontWeight: '800' }}>{item.quantity} IN STOCK</Text>
                    </View>
                </View>

                <View style={styles.inputRow}>
                    {/* Price Input */}
                    <View style={[styles.priceBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={{ color: colors.subText, fontSize: 10, fontWeight: 'bold' }}>KSH</Text>
                        <TextInput
                            style={[styles.priceInput, { color: colors.text }]}
                            keyboardType="numeric"
                            value={displayPrice}
                            onChangeText={text => {
                                setSellingPrices(prev => ({ ...prev, [item.id]: text }));
                                if (currentQty > 0) handleAddToCart(item, currentQty, parseFloat(text) || 0);
                            }}
                        />
                    </View>

                    {/* Qty Controls */}
                    <View style={[styles.qtyContainer, { backgroundColor: colors.primary + '15' }]}>
                        <TouchableOpacity onPress={() => handleAddToCart(item, Math.max(0, currentQty - 1))} style={styles.qtyBtn}>
                            <Ionicons name="remove" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, { color: colors.text }]}>{currentQty}</Text>
                        <TouchableOpacity onPress={() => handleAddToCart(item, currentQty + 1)} style={styles.qtyBtn}>
                            <Ionicons name="add" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={() => handleAddToCart(item, currentQty + 1)}
                    style={[styles.addBtn, { backgroundColor: currentQty > 0 ? colors.primary : colors.primary + '20' }]}
                >
                    <Text style={{ color: currentQty > 0 ? '#fff' : colors.primary, fontWeight: '800', fontSize: 13 }}>
                        {currentQty > 0 ? 'UPDATE CART' : 'ADD TO CART'}
                    </Text>
                    {currentQty > 0 && <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
            </View>
        );
    };

    const filtered = products.filter(item =>
        item.product_name?.toLowerCase().includes(query?.toLowerCase()) ||
        (item.barcode && item.barcode.includes(query))
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <PageHeader component={() => (
                <View style={styles.headerContent}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <SearchBar white placeholder="Search products..." />
                    </View>
                    <TouchableOpacity onPress={() => setIsScannerOpen(true)} style={styles.scanBtn}>
                        <Ionicons name="barcode-outline" size={22} color="white" />
                    </TouchableOpacity>
                </View>
            )} />

            {/* FLOATING BACK BUTTON */}
            <TouchableOpacity 
                style={[styles.fabBack, { backgroundColor: colors.card, shadowColor: '#000' }]} 
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            {msg.msg ? <Toast setMsg={setMsg} {...msg} /> : null}

            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listPadding}
                onEndReached={() => loadData(page + 1, true)}
                ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ margin: 20 }} /> : null}
            />

            {cart.length > 0 && (
                <View style={[styles.checkoutPill, { backgroundColor: colors.card }]}>
                    <View>
                        <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                        <Text style={[styles.totalValue, { color: colors.text }]}>Ksh {total.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity style={[styles.payBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
                        <Text style={styles.payText}>PAY ({cart.length})</Text>
                        <Ionicons name="chevron-forward" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Scanner Modal & Checkout Modal Logic */}
            <CheckoutModal
                setMsg={setMsg}
                msg={msg}
                cartItems={cart}
                clearCart={() => dispatch(clearCart())}
                PostLocally={PostSale}
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    scanBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
    fabBack: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100,
        left: 16,
        zIndex: 10,
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    listPadding: { padding: 16, paddingBottom: 150, paddingTop: 60 },
    card: {
        padding: 16,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 1,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    productName: { fontSize: 17, fontWeight: '800' },
    stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    priceBox: { 
        width: '45%', 
        height: 50, 
        borderRadius: 14, 
        borderWidth: 1, 
        paddingHorizontal: 12, 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    priceInput: { flex: 1, fontWeight: '900', fontSize: 16, marginLeft: 5 },
    qtyContainer: { 
        width: '50%', 
        height: 50, 
        borderRadius: 14, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 4
    },
    qtyBtn: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontWeight: '900', fontSize: 18 },
    addBtn: { 
        height: 48, 
        borderRadius: 14, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    checkoutPill: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    totalLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', letterSpacing: 1 },
    totalValue: { fontSize: 22, fontWeight: '900' },
    payBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 12, 
        borderRadius: 18 
    },
    payText: { color: '#fff', fontWeight: '900', marginRight: 8 }
});

export default SalesScreen;