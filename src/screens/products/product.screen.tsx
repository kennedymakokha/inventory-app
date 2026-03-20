import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Dimensions,
    LayoutAnimation,
    Modal,
    TextInput
} from 'react-native';



import { getDBConnection } from '../../services/db-service';
import { CategoryItem, ProductItem } from '../../../models';
import {

    getProducts,
    createProduct,
    softDeleteProduct,
    updateProduct,
} from '../../services/product.service';

import AddProductModal from './components/addProductModal';
import UploadProductsModal from './components/uploadProduct.modal';
import PageHeader from '../../components/pageHeader';
import Icon from 'react-native-vector-icons/Feather';

import { useSearch } from '../../context/searchContext';
import RadialFab from '../../components/multiFab';
import { getCategories } from '../../services/category.service';

import { validateItem } from '../validations/product.validation';
import { useSelector } from 'react-redux';
import Toast from '../../components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from "uuid";
import SwipeableCard from '../../components/SwipeableCard';
import { motobikeParts } from '../../../data';
import { useTheme } from '../../context/themeContext';
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;



const ProductScreen = () => {

    const { query } = useSearch();
    const { user } = useSelector((state: any) => state.auth);
    const { business } = user;
    const initialState = {
        product_name: "",
        category_id: "",
        business_id: business._id,
        price: 0,
        expiryDate: "",
        initial_stock: "",
        description: "",
        quantity: 0,
        Bprice: 0,
        product_id: ""
    };

    const swipeRefs = useRef<any>({});
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [restockModalVisible, setRestockModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
    const [restockQty, setRestockQty] = useState('');
    const [item, setItem] = useState(initialState);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [saving, setSaving] = useState(false);
    const PAGE_SIZE = 20;
    const currentlyOpenSwipe = useRef<any>(null);
    const { colors, isDarkMode } = useTheme();
    const loadProducts = async () => {
        if (loading || !hasMore) return;

        setLoading(true);

        try {
            const db = await getDBConnection();

            const newProducts = await getProducts(db, PAGE_SIZE, offset);

            if (newProducts.length < PAGE_SIZE) {
                setHasMore(false);
            }

            setProducts(prev => [...prev, ...newProducts]);
            setOffset(prev => prev + PAGE_SIZE);
            const cats = await getCategories(db);
            setCategories(cats);

        } catch (err) {
            console.log(" loadProducts error:", err);
        }

        setLoading(false);
    };


    const onRefresh = async () => {
        setRefreshing(true);

        setOffset(0);
        setHasMore(true);

        const db = await getDBConnection();

        const storedItems = await getProducts(db, PAGE_SIZE, 0);

        setProducts(storedItems);
        setOffset(PAGE_SIZE);

        setRefreshing(false);
    };

    const handleAddProduct = async () => {
        if (saving) return;   // 🚨 prevents duplicate calls
        if (!validateItem(item, setMsg)) return;

        try {
            setSaving(true);

            if (item.product_id) {

                item.business_id = business._id
                await updateProduct(item);
                swipeRefs.current[item.product_id]?.close();
                setMsg({ msg: "Product updated!", state: "success" });
            } else {

                await createProduct(item);
                setMsg({ msg: "Product added!", state: "success" });
            }

            setItem(initialState);
            setModalVisible(false);
            await onRefresh();

        } catch (error: any) {
            setMsg({ msg: error.message || " Error saving product.", state: "error" });
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p?.product_name?.toLowerCase().includes(query?.toLowerCase());
        const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
        return matchesSearch && matchesCategory;
    });


    const handleRestock = async () => {
        if (!selectedProduct || !restockQty) return;

        const qty = parseInt(restockQty);
        if (isNaN(qty)) return;

        try {
            const db = await getDBConnection();
            const now = new Date().toISOString();
            const createdBy = await AsyncStorage.getItem("userId");

            const newQty = selectedProduct.quantity + qty;

            // update product quantity
            await db.executeSql(
                `UPDATE Product 
             SET quantity = ?, updatedAt = ?, synced = 0
             WHERE product_id = ?`,
                [newQty, now, selectedProduct.product_id]
            );
            const inve_id = uuidv4();
            // add inventory log
            await db.executeSql(
                `INSERT INTO Inventory_log
            (inventory_log_id,product_id, reference_type, quantity,business, note, createdBy, synced, createdAt)
            VALUES (?,?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    inve_id,
                    selectedProduct.product_id,
                    "RESTOCK",

                    qty,
                    business._id,
                    "Manual restock",
                    createdBy,
                    0,
                    now
                ]
            );

            // update UI
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            setProducts(prev =>
                prev.map(p =>
                    p.product_id === selectedProduct.product_id
                        ? { ...p, quantity: newQty }
                        : p
                )
            );

            setRestockModalVisible(false);
            setRestockQty('');

        } catch (err) {
            console.log("Restock error:", err);
        }
    };
    const handleDelete = async (prod: ProductItem) => {
        try {
            await softDeleteProduct(prod.product_id)
            await onRefresh();
        } catch (error) {
            console.log(error)
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);


    const renderProductCard = ({ item }: { item: ProductItem }) => {
        const lowStock = item.quantity <= 5;
        const sales = (item as any)?.total_sales || 0;

        return (
            <SwipeableCard
                uniqueId={item.product_id}
                swipeRefs={swipeRefs}
                currentlyOpenSwipe={currentlyOpenSwipe}
                onEdit={() => { setItem({ ...item }); setModalVisible(true); }}
                onDelete={() => handleDelete(item)}
            >

                <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={() => {
                        swipeRefs.current[item.product_id]?.close(); // 👈 close swipe
                        setSelectedProduct(item);
                        setRestockModalVisible(true);
                    }}
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            shadowColor: lowStock ? '#ef4444' : '#000',
                            shadowOpacity: lowStock ? 0.8 : 0.2,
                        }
                    ]}
                >
                    {/* TOP ROW */}
                    <View style={styles.rowBetween}>
                        <Text style={[styles.productName, { color: colors.text }]}>
                            {item.product_name}
                        </Text>

                        <Text style={[styles.priceText, { color: colors.text }]}>
                            Ksh {item.price}
                        </Text>
                    </View>

                    {/* MIDDLE ROW */}
                    <View style={styles.rowBetween}>
                        <Text style={{ color: colors.subText, fontSize: 12 }}>
                            {categories.find(c => c.category_id === item.category_id)?.category_name || ''}
                        </Text>

                        {sales > 0 && (
                            <View style={styles.salesBadge}>
                                <Text style={styles.salesText}>🔥 {sales}</Text>
                            </View>
                        )}
                    </View>

                    {/* BOTTOM ROW */}
                    <View style={styles.rowBetween}>
                        <Text style={{ color: colors.subText, fontSize: 12 }}>
                            {item.expiryDate ? `Exp: ${new Date(item.expiryDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                            })}` : ''}
                        </Text>

                        <View
                            style={[
                                styles.stockBadge,
                                { backgroundColor: lowStock ? colors.danger : colors.success }
                            ]}
                        >
                            <Text style={styles.stockText}>
                                {item.quantity} left
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </SwipeableCard>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 16 }}>
            <PageHeader
                component={() => (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContainer}
                        style={{ flexGrow: 0 }}
                    >
                        <TouchableOpacity
                            onPress={() => setSelectedCategoryId(null)}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor:
                                        selectedCategoryId === null
                                            ? colors.primary
                                            : colors.chipInactive
                                }
                            ]}
                        >
                            <Text style={{
                                color: selectedCategoryId === null ? '#fff' : colors.chipTextInactive
                            }}>
                                All
                            </Text>
                        </TouchableOpacity>

                        {categories.map((cat: any) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategoryId(cat.category_id)}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor:
                                            selectedCategoryId === cat.category_id
                                                ? colors.primary
                                                : colors.chipInactive
                                    }
                                ]}
                            >
                                <Text style={{
                                    color: selectedCategoryId === cat.category_id
                                        ? '#fff'
                                        : colors.chipTextInactive
                                }}>
                                    {cat.category_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            />



            <FlatList
                data={filteredProducts}
                keyExtractor={(item, index) => String(item.id || index)}
                renderItem={renderProductCard}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 12 }}
                onEndReached={loadProducts}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loading ? <ActivityIndicator color={colors.primary} /> : null
                }
            />
            {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}
            {/* RESTOCK MODAL */}
            <Modal visible={restockModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
                        <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 10 }}>
                            Restock {selectedProduct?.product_name}
                        </Text>

                        <TextInput
                            placeholder="Enter quantity"
                            placeholderTextColor={colors.subText}
                            keyboardType="numeric"
                            value={restockQty}
                            onChangeText={setRestockQty}
                            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                        />

                        <TouchableOpacity
                            onPress={() => handleRestock()}
                            style={styles.confirmBtn}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700' }}>
                                Confirm Restock
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <AddProductModal
                isDarkMode={isDarkMode}
                setMsg={setMsg}
                msg={msg}
                categories={categories}
                PostLocally={() => handleAddProduct()}
                loading={loading}
                modalVisible={modalVisible}
                setItem={setItem}
                fetchProducts={onRefresh}
                initialData={item}
                setModalVisible={setModalVisible}
            />


            <UploadProductsModal
                isDarkMode={isDarkMode}
                setMsg={setMsg}
                msg={msg}
                PostLocally={() => { }}
                modalVisible={uploadModalVisible}
                setItem={setItem}
                fetchProducts={onRefresh}
                initialData={item}
                setModalVisible={setUploadModalVisible}
            />
            <RadialFab
                mainColor={colors.primary}
                mainIcon="menu"
                radius={120}
                angle={90}
                actions={[
                    { icon: 'add-outline', label: 'Add Product', onPress: () => setModalVisible(true) },
                    { icon: 'cloud-upload-outline', label: 'Upload', onPress: () => setUploadModalVisible(true) },
                    { icon: 'settings-outline', label: 'Settings', onPress: () => console.log('Settings') },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    filterContainer: {

        paddingHorizontal: 2,
        paddingVertical: 8,

        alignItems: 'center'
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 2,
        marginRight: 10,
    },
    card: {
        width: CARD_WIDTH,
        padding: 14,
        borderRadius: 5,
        marginBottom: 16,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 6,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    productName: {
        fontWeight: '700',
        fontSize: 14,
        flex: 1
    },
    priceText: {
        fontWeight: '700',
        fontSize: 14,
    },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    stockText: {
        color: '#fff',
        fontSize: 11,
    },
    salesBadge: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    salesText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '700'
    },
    swipeContainer: {
        flexDirection: 'row',
        height: '90%',
        alignItems: 'center',
        marginVertical: 8

    },
    swipeBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        marginLeft: 8,
        borderRadius: 4,
    },
    swipeText: {
        color: '#fff',
        fontWeight: '600'
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    modalBox: {
        width: '80%',
        padding: 20,
        borderRadius: 8
    },
    input: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 20
    },
    confirmBtn: {
        backgroundColor: '#22c55e',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center'
    }
});

export default ProductScreen;