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
    RefreshControl
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from "uuid";
import { useSelector } from 'react-redux';

import { getDBConnection } from '../../services/db-service';
import { CategoryItem, ProductItem } from '../../../models';
import { getProducts, createProduct, softDeleteProduct, updateProduct } from '../../services/product.service';
import { getsubCategories } from '../../services/category.service';
import { validateItem } from '../validations/product.validation';

import AddProductModal from './components/addProductModal';
import UploadProductsModal from './components/uploadProduct.modal';
import PageHeader from '../../components/pageHeader';
import { useSearch } from '../../context/searchContext';
import RadialFab from '../../components/multiFab';
import Toast from '../../components/Toast';
import SwipeableCard from '../../components/SwipeableCard';
import { useTheme } from '../../context/themeContext';
import { InputContainer } from '../../components/Input';
import RestockModal from './components/restockModal';
import getInitials from '../../utils/initials';
import { clinicalInventory } from '../../../data';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; // Adjusted for better spacing

const ProductScreen = () => {
    const { query } = useSearch();
    const { user } = useSelector((state: any) => state.auth);
    const { business } = user;
    const { colors, isDarkMode } = useTheme();

    const initialState = {
        product_name: "",
        category_id: "",
        sub_category_id: "",
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
    const currentlyOpenSwipe = useRef<any>(null);

    const [products, setProducts] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[] | any>([]);
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
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const PAGE_SIZE = 20;

    const loadProducts = async (isRefresh = false) => {
        if (loading || (!hasMore && !isRefresh)) return;
        setLoading(true);
        try {
            const db = await getDBConnection();
            const currentOffset = isRefresh ? 0 : offset;
            const newProducts = await getProducts(db, PAGE_SIZE, currentOffset);

            if (isRefresh) {
                setProducts(newProducts);
                setOffset(PAGE_SIZE);
                setHasMore(newProducts.length === PAGE_SIZE);
            } else {
                setProducts(prev => [...prev, ...newProducts]);
                setOffset(prev => prev + PAGE_SIZE);
                setHasMore(newProducts.length === PAGE_SIZE);
            }

            const cats = await getsubCategories(db);
            setCategories(cats);
        } catch (err) {
            console.log("loadProducts error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProducts(true); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts(true);
        setRefreshing(false);
    };

    const handleAddProduct = async () => {
        if (saving) return;
        if (!validateItem(item, setMsg)) return;

        try {
            setSaving(true);
            if (item.product_id) {
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
            setMsg({ msg: error.message || "Error saving product.", state: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleRestock = async () => {
        if (!selectedProduct || !restockQty) return;
        const qty = parseInt(restockQty);
        if (isNaN(qty)) return;

        try {
            const db = await getDBConnection();
            const now = new Date().toISOString();
            const createdBy = await AsyncStorage.getItem("userId");
            const newQty = (selectedProduct.quantity || 0) + qty;

            await db.executeSql(
                `UPDATE Product SET quantity = ?, updatedAt = ?, synced = 0 WHERE product_id = ?`,
                [newQty, now, selectedProduct.product_id]
            );

            await db.executeSql(
                `INSERT INTO Inventory_log (inventory_log_id, product_id, reference_type, quantity, business, note, createdBy, synced, createdAt,batchNumber,expiryDate) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [uuidv4(), selectedProduct.product_id, "RESTOCK", qty, business._id, "Manual restock", createdBy, 0, now, selectedProduct ? (selectedProduct.product_name ? getInitials(selectedProduct.product_name) + '-' + Date.now() : "GENERAL-" + Date.now()) : "", expiryDate ? expiryDate.toISOString() : null]
            );
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setProducts(prev => prev.map(p => p.product_id === selectedProduct.product_id ? { ...p, quantity: newQty } : p));
            setRestockModalVisible(false);
            setRestockQty('');
            setMsg({ msg: "Inventory updated", state: "success" });
        } catch (err) {
            console.log("Restock error:", err);
        }
    };

    const handleDelete = async (prod: ProductItem) => {
        try {
            await softDeleteProduct(prod.product_id);
            await onRefresh();
        } catch (error) {
            console.log(error);
        }
    };
    const handleStagedProduct = async () => {
        try {
            setSaving(true);

            // 1. Map Sub-Category names to an object containing BOTH IDs
            const subCategoryMap: Record<string, { catId: string, subCatId: string }> = {};
            console.log(categories)
            categories.forEach((cat: any) => {
                const name = cat.sub_category_name?.trim().toLowerCase();
                subCategoryMap[name] = {
                    catId: cat.category_id,      // The parent category ID
                    subCatId: cat.sub_category_id // The specific sub-category ID
                };
            });

            for (const mainCategory of clinicalInventory) {
                for (const subCat of mainCategory.sub_categories) {

                    const subCatName = subCat.sub_category_name.trim().toLowerCase();
                    const ids = subCategoryMap[subCatName];

                    if (!ids) {
                        console.warn(`Missing IDs for sub-category: ${subCat.sub_category_name}`);
                        continue;
                    }

                    const productsArray = subCat.description.split(/\s*,\s*/);

                    for (const productName of productsArray) {
                        const item = {
                            business_id: business._id,
                            category_id: ids.catId,       // Parent ID saved here
                            sub_category_id: ids.subCatId, // Sub ID saved here
                            product_name: productName,
                            price: Math.floor(Math.random() * 801) + 200,
                            initial_stock: Math.floor(Math.random() * 51) + 50,
                            description: productName,
                            Bprice: Math.floor(Math.random() * 1000),
                        };

                        await createProduct(item);
                    }
                }
            }

            setMsg({ msg: "Inventory products added!", state: "success" });
            setModalVisible(false);
            await onRefresh();

        } catch (error: any) {
            console.error(error);
            setMsg({ msg: error.message || "Error saving products.", state: "error" });
        } finally {
            setSaving(false);
        }
    };
    const filteredProducts = products.filter((p:any) => {
        const matchesSearch = p?.product_name?.toLowerCase().includes(query?.toLowerCase());
        const matchesCategory = selectedCategoryId ? p.sub_category_id === selectedCategoryId : true;
        return matchesSearch && matchesCategory;
    });
    console.log(categories)
    const renderProductCard = ({ item }: { item: ProductItem | any }) => {
        const isLowStock = item.quantity <= 5;
        const isOutOfStock = item.quantity <= 0;

        return (
            <SwipeableCard
                uniqueId={item.product_id}
                swipeRefs={swipeRefs}
                currentlyOpenSwipe={currentlyOpenSwipe}
                onEdit={() => { setItem({ ...item }); setModalVisible(true); }}
                onDelete={() => handleDelete(item)}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onLongPress={() => {
                        swipeRefs.current[item.product_id]?.close();
                        setSelectedProduct(item);
                        setRestockModalVisible(true);
                    }}
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.card,
                            borderColor: isLowStock ? colors.danger + '40' : colors.border
                        }
                    ]}
                >
                    <View style={styles.cardHeader}>
                        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                            {item.product_name}
                        </Text>
                        <Text style={[styles.priceText, { color: colors.primary }]}>
                            {item.price}
                        </Text>
                    </View>

                    <Text style={[styles.categoryLabel, { color: colors.subText }]}>
                        {categories.find((c: any) => c.sub_category_id === item.sub_category_id)?.sub_category_name || 'General'}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={[
                            styles.stockBadge,
                            { backgroundColor: isOutOfStock ? colors.danger : isLowStock ? '#f59e0b' : colors.success + '20' }
                        ]}>
                            <Text style={[
                                styles.stockText,
                                { color: isLowStock || isOutOfStock ? '#fff' : colors.success }
                            ]}>
                                {item.quantity} units
                            </Text>
                        </View>
                        {(item as any).total_sales > 10 && (
                            <Ionicons name="flame" size={16} color="#ef4444" />
                        )}
                    </View>
                </TouchableOpacity>
            </SwipeableCard>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <PageHeader
                component={() => (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedCategoryId(null)}
                            style={[styles.chip, { backgroundColor: selectedCategoryId === null ? colors.primary : colors.card, borderColor: colors.border }]}
                        >
                            <Text style={[styles.chipText, { color: selectedCategoryId === null ? '#fff' : colors.subText }]}>All</Text>
                        </TouchableOpacity>
                        {categories.map((cat: any) => (
                            <TouchableOpacity
                                key={cat.sub_category_id}
                                onPress={() => setSelectedCategoryId(cat.sub_category_id)}
                                style={[styles.chip, { backgroundColor: selectedCategoryId === cat.sub_category_id ? colors.primary : colors.card, borderColor: colors.border }]}
                            >
                                <Text style={[styles.chipText, { color: selectedCategoryId === cat.sub_category_id ? '#fff' : colors.subText }]}>
                                    {cat.sub_category_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            />
            {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.product_id}
                renderItem={renderProductCard}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                onEndReached={() => loadProducts()}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ margin: 20 }} /> : null}
            />





            <RestockModal
                modalVisible={restockModalVisible}
                setModalVisible={setRestockModalVisible}
                selectedProduct={selectedProduct}
                restockQty={restockQty}
                setRestockQty={setRestockQty}
                handleRestock={handleRestock}
                isDarkMode={isDarkMode}
                batchNumber={selectedProduct ? (selectedProduct.product_name ? getInitials(selectedProduct.product_name) + '-' + Date.now() : "GENERAL-" + Date.now()) : ""}

                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}

            />
            <AddProductModal
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                item={item}
                setItem={setItem}
                categories={categories}
                PostLocally={handleAddProduct}
                onClose={() => { setModalVisible(false); setItem(initialState) }}
                msg={msg}
                setMsg={setMsg}
                loading={loading}
                isDarkMode={isDarkMode}
            />
            <UploadProductsModal
                {...{ modalVisible: uploadModalVisible, setModalVisible: setUploadModalVisible, onRefresh, isDarkMode }}
            />

            <RadialFab
                mainColor={colors.primary}
                mainIcon="add-outline"
                actions={[
                    { icon: 'cube-outline', label: 'Product', onPress: () => setModalVisible(true) },
                    { icon: 'cloud-upload-outline', label: 'Import', onPress: () => setUploadModalVisible(true) },
                    { icon: 'sync-outline', label: 'Refresh', onPress: handleStagedProduct },

                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    filterContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13, fontWeight: '600' },
    listContent: { paddingBottom: 120 },
    columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
    card: {
        width: CARD_WIDTH,
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    cardHeader: { marginBottom: 4 },
    productName: { fontWeight: '800', fontSize: 14, marginBottom: 2 },
    priceText: { fontWeight: '900', fontSize: 15 },
    categoryLabel: { fontSize: 11, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    stockText: { fontSize: 10, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { width: '85%', padding: 24, borderRadius: 24, borderWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20, alignItems: 'center' },
    confirmBtn: { padding: 14, borderRadius: 12, alignItems: 'center' }
});

export default ProductScreen;