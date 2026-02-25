import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
    StyleSheet
} from 'react-native';

import { getDBConnection } from '../../services/db-service';
import { CategoryItem, ProductItem } from '../../../models';
import { 
    createProductTable, 
    getProducts, 
    saveProductItems 
} from '../../services/product.service';

import AddProductModal from './components/addProductModal';
import UploadProductsModal from './components/uploadProduct.modal';
import { validateItem } from '../validations/product.validation';
import PageHeader from '../../components/pageHeader';
import { createInventoryTable } from '../../services/inventory.service';
import { useCreateProductMutation } from '../../services/productApi';

import { useSearch } from '../../context/searchContext';
import RadialFab from '../../components/multiFab';
import { getCategories } from '../../services/category.service';
import { Theme } from '../../utils/theme';
import { useSettings } from '../../context/SettingsContext';

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

    // States
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [item, setItem] = useState(initialState);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [postProductToMongoDB] = useCreateProductMutation();

    // Main Data Loader
    const loadData = useCallback(async (isInitial = false) => {
        if (loading || (!isInitial && !hasMore)) return;

        try {
            setLoading(true);
            const db = await getDBConnection();
            
            // Initial setup (consider moving table creation to App.js/entry point)
            if (isInitial) {
                await createProductTable(db);
                await createInventoryTable(db);
                const allCategories = await getCategories(db);
                setCategories(allCategories);
            }

            const currentOffset = isInitial ? 0 : offset;
            const storedItems = await getProducts(db, currentOffset);

            if (storedItems.length < 10) {
                setHasMore(false);
            }

            setProducts(prev => isInitial ? storedItems : [...prev, ...storedItems]);
            setOffset(prev => prev + 10);

        } catch (error) {
            console.error('❌ Error loading products:', error);
        } finally {
            setLoading(false);
        }
    }, [offset, loading, hasMore]);

    // Initial Fetch
    useEffect(() => {
        loadData(true);
    }, []);

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

    // Filtered List Logic (In-memory for better UX while searching)
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.product_name.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
        return matchesSearch && matchesCategory;
    });

    const renderProductCard = ({ item }: { item: ProductItem }) => {
        const lowStock = item.quantity <= 5;
        return (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardRow}>
                    <Text style={[styles.productName, { color: theme.text }]}>{item.product_name}</Text>
                    <Text style={[styles.productPrice, { color: theme.text }]}>Ksh {item.price}</Text>
                </View>
                <View style={styles.cardRow}>
                    <Text style={{ color: lowStock ? Theme.danger : Theme.success, fontWeight: '600' }}>
                        {item.quantity} in stock 
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 12 }}>
                        {item.expiryDate ? `Exp: ${item.expiryDate}` : ''}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: 16 }}>
            <PageHeader />

            <View style={{ flex: 1 }}>
                {/* Category Filter Scroll */}
                <View style={{ height: 60, marginVertical: 8 }}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.filterContainer}
                    >
                        <TouchableOpacity
                            onPress={() => setSelectedCategoryId(null)}
                            style={[
                                styles.chip,
                                { backgroundColor: selectedCategoryId === null ? Theme.primary : theme.chipInactive }
                            ]}
                        >
                            <Text style={{ color: selectedCategoryId === null ? '#fff' : theme.chipTextInactive }}>
                                All Products
                            </Text>
                        </TouchableOpacity>

                        {categories.map((cat: CategoryItem) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategoryId(cat?.category_id)}
                                style={[
                                    styles.chip,
                                    { backgroundColor: selectedCategoryId === cat.category_id ? Theme.primary : theme.chipInactive }
                                ]}
                            >
                                <Text style={{ 
                                    color: selectedCategoryId === cat.category_id ? '#fff' : theme.chipTextInactive,
                                    fontWeight: '500' 
                                }}>
                                    {cat.category_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredProducts}
                    contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
                    keyExtractor={(item, index) => String(item.id || index)}
                    renderItem={renderProductCard}
                    onEndReached={() => loadData()}
                    onEndReachedThreshold={0.3}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            tintColor={Theme.primary} 
                        />
                    }
                    ListFooterComponent={loading && !refreshing ? <ActivityIndicator color={Theme.primary} /> : null}
                    ListEmptyComponent={
                        !loading ? <Text style={styles.emptyText}>No products found.</Text> : null
                    }
                />
            </View>

            {/* Modals */}
            <AddProductModal
                isDarkMode={isDarkMode}
                setMsg={setMsg}
                msg={msg}
                categories={categories}
                PostLocally={handleAddProduct}
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
                PostLocally={handleAddProduct}
                modalVisible={uploadModalVisible}
                setItem={setItem}
                fetchProducts={onRefresh}
                item={item}
                setModalVisible={setUploadModalVisible}
            />

            <RadialFab
                mainColor={isDarkMode ? "#1e293b" : "#334155"}
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    chip: {
        minWidth: 90,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    card: {
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    productName: {
        fontWeight: '700',
        fontSize: 16,
    },
    productPrice: {
        fontWeight: '700',
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        opacity: 0.5
    }
});

export default ProductScreen;