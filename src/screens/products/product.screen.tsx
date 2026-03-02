import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Dimensions,
    LayoutAnimation,
    UIManager,
    Platform,
    Modal,
    TextInput
} from 'react-native';

import { Swipeable } from 'react-native-gesture-handler';

import { getDBConnection } from '../../services/db-service';
import { CategoryItem, ProductItem } from '../../../models';
import {
    createProductTable,
    getProducts,
    saveProductItems,
} from '../../services/product.service';

import AddProductModal from './components/addProductModal';
import UploadProductsModal from './components/uploadProduct.modal';
import PageHeader from '../../components/pageHeader';
import Icon from 'react-native-vector-icons/Feather';
import { createInventoryTable } from '../../services/inventory.service';
import { useSearch } from '../../context/searchContext';
import RadialFab from '../../components/multiFab';
import { getCategories } from '../../services/category.service';
import { Theme } from '../../utils/theme';
import { useSettings } from '../../context/SettingsContext';
import RestockModal from './components/restockModal';
import { useCreateProductMutation } from '../../services/productApi';
import { validateItem } from '../validations/product.validation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const ProductScreen = () => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;
    const { query } = useSearch();
    const initialState = {
        product_name: "",
        category_id: "",
        price: "",
        expiryDate: "",
        initial_stock: "",
        description: "",
        quantity: 0,
        Bprice: 0
    };
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

    const [postProductToMongoDB] = useCreateProductMutation();
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const db = await getDBConnection();
            await createProductTable(db);
            await createInventoryTable(db);
            const stored = await getProducts(db, 0);
            const cats = await getCategories(db);
            setProducts(stored);
            setCategories(cats);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    // const onRefresh = async () => {
    //     setRefreshing(true);
    //     await loadData();
    //     setRefreshing(false);
    // };

    const onRefresh = async () => {
        setRefreshing(true);
        setHasMore(true);
        setOffset(0);
        const db = await getDBConnection();
        const storedItems = await getProducts(db, 0);
        setProducts(storedItems);
        setRefreshing(false);
    };

    const handleAddProduct = async () => {
        if (!validateItem(item, setMsg)) return;
        try {
            const db = await getDBConnection();
            await saveProductItems(db, item, postProductToMongoDB);

            // Reset and reload
            setItem(initialState);
            setModalVisible(false);
            setMsg({ msg: '✅ Product added!', state: 'success' });
            onRefresh();
        } catch (error: any) {
            setMsg({ msg: error.message || '❌ Error adding product.', state: 'error' });
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.product_name.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
        return matchesSearch && matchesCategory;
    });

    const handleRestock = async () => {
        if (!selectedProduct || !restockQty) return;
        const qty = parseInt(restockQty);
        if (isNaN(qty)) return;

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const updated = products.map(p =>
            p.id === selectedProduct.id
                ? { ...p, quantity: p.quantity + qty }
                : p
        );

        setProducts(updated);
        setRestockModalVisible(false);
        setRestockQty('');
    };
    const handleDelete = async (prod: ProductItem) => {
        try {
            console.log("Deleting product with id:", prod,selectedProduct);
            const db = await getDBConnection();
            await db.executeSql('DELETE FROM products WHERE id=?', [prod.id]);
            setCategories(prev => prev.filter(c => c.id !== prod.id));
        } catch (error) {
            console.log(error)
        }
    };
    const renderRightActions = () => (

        <View style={styles.swipeContainer}>
            <TouchableOpacity onPress={() => { setItem(item); setModalVisible(true); }} style={[styles.swipeBtn, { backgroundColor: Theme.primary }]}>
                <Icon name="edit" size={20} color="#fff" style={styles.swipeText} />
                <Text style={styles.swipeText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.swipeBtn, { backgroundColor: Theme.danger }]}>
                <Icon name="trash" size={20} color="#fff" />
                <Text style={styles.swipeText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    const renderProductCard = ({ item }: { item: ProductItem }) => {
        const lowStock = item.quantity <= 5;
        const sales = (item as any)?.total_sales || 0;

        return (
            <Swipeable renderRightActions={renderRightActions}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={() => {
                        setSelectedProduct(item);
                        setRestockModalVisible(true);
                    }}
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            shadowColor: lowStock ? '#ef4444' : '#000',
                            shadowOpacity: lowStock ? 0.8 : 0.2,
                        }
                    ]}
                >
                    {/* TOP ROW */}
                    <View style={styles.rowBetween}>
                        <Text style={[styles.productName, { color: theme.text }]}>
                            {item.product_name}
                        </Text>

                        <Text style={[styles.priceText, { color: theme.text }]}>
                            Ksh {item.price}
                        </Text>
                    </View>

                    {/* MIDDLE ROW */}
                    <View style={styles.rowBetween}>
                        <Text style={{ color: theme.subText, fontSize: 12 }}>
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
                        <Text style={{ color: theme.subText, fontSize: 12 }}>
                            {item.expiryDate ? `Exp: ${new Date(item.expiryDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                            })}` : ''}
                        </Text>

                        <View
                            style={[
                                styles.stockBadge,
                                { backgroundColor: lowStock ? '#7f1d1d' : '#064e3b' }
                            ]}
                        >
                            <Text style={styles.stockText}>
                                {item.quantity} left
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: 16 }}>
            <PageHeader />

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
                                    ? Theme.primary
                                    : theme.chipInactive
                        }
                    ]}
                >
                    <Text style={{
                        color: selectedCategoryId === null ? '#fff' : theme.chipTextInactive
                    }}>
                        All
                    </Text>
                </TouchableOpacity>

                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedCategoryId(cat.category_id)}
                        style={[
                            styles.chip,
                            {
                                backgroundColor:
                                    selectedCategoryId === cat.category_id
                                        ? Theme.primary
                                        : theme.chipInactive
                            }
                        ]}
                    >
                        <Text style={{
                            color: selectedCategoryId === cat.category_id
                                ? '#fff'
                                : theme.chipTextInactive
                        }}>
                            {cat.category_name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filteredProducts}
                numColumns={2}
                keyExtractor={(item, index) => String(item.id || index)}
                renderItem={renderProductCard}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 12 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
                }
                ListFooterComponent={
                    loading ? <ActivityIndicator color={Theme.primary} /> : null
                }
            />

            {/* RESTOCK MODAL */}
            <Modal visible={restockModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
                        <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 10 }}>
                            Restock {selectedProduct?.product_name}
                        </Text>

                        <TextInput
                            placeholder="Enter quantity"
                            placeholderTextColor={theme.subText}
                            keyboardType="numeric"
                            value={restockQty}
                            onChangeText={setRestockQty}
                            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
                        />

                        <TouchableOpacity
                            onPress={handleRestock}
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
                PostLocally={handleAddProduct}
                loading={loading}
                modalVisible={modalVisible}
                setItem={setItem}
                fetchProducts={onRefresh}
                item={item}
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
                item={item}
                setModalVisible={setUploadModalVisible}
            />
            <RadialFab
                mainColor={Theme.primary}
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
        paddingHorizontal: 16,
        paddingVertical: 8,
       
        alignItems: 'center'
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 5,
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