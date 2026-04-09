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
import { CategoryItem } from '../../../models';
import { getProducts, createProduct, softDeleteProduct, updateProduct } from '../../services/product.service';
import { getCategories, getsubCategories, saveSubCategoryItems, updateSubCategory } from '../../services/category.service';
import { validateItem } from '../validations/Subcategory.validation';

import UploadDataModal from './components/uploadProduct.modal';
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
import AddSubCategory from './components/addModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; // Adjusted for better spacing

const SubCategoryScreen = () => {
    const { query } = useSearch();
    const { user } = useSelector((state: any) => state.auth);
    const { business } = user;
    const { colors, isDarkMode } = useTheme();

    const initialState = {
        sub_category_name: "",
        category_id: "",
        business_id: business._id,

    };

    const swipeRefs = useRef<any>({});
    const currentlyOpenSwipe = useRef<any>(null);

    const [subCategories, setsubCategories] = useState<any[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);

    const [item, setItem] = useState<any>(initialState);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [saving, setSaving] = useState(false);

    const PAGE_SIZE = 20;

    const loadData = async (isRefresh = false) => {
        if (loading || (!hasMore && !isRefresh)) return;
        setLoading(true);
        try {
            const db = await getDBConnection();
            const currentOffset = isRefresh ? 0 : offset;
            const newCategories = await getsubCategories(db);

            if (isRefresh) {
                setsubCategories(newCategories);
                setOffset(PAGE_SIZE);
                setHasMore(newCategories.length === PAGE_SIZE);
            } else {
                setsubCategories(prev => [...prev, ...newCategories]);
                setOffset(prev => prev + PAGE_SIZE);
                setHasMore(newCategories.length === PAGE_SIZE);
            }

            const cats = await getCategories(db);
            setCategories(cats);
        } catch (err) {
            console.log("loadData error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(true); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData(true);
        setRefreshing(false);
    };

    const handleAddSubCategory = async () => {
        if (saving) return;
        if (!validateItem(item, setMsg)) return;

        try {
            setSaving(true);
            if (item.sub_category_id) {
                await updateSubCategory(item);
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



    const handleDelete = async (prod: any) => {
        try {
            await softDeleteProduct(prod.product_id);
            await onRefresh();
        } catch (error) {
            console.log(error);
        }
    };

    const handleStaged = async () => {

        try {
            setSaving(true);

            const categoryMap: any = {};
            categories.forEach(cat => {
                categoryMap[cat.category_name] = cat.category_id;
            });

            // Step 2: Replace category name with category_id
            const updatedProducts = clinicalInventory.map(({ category_name, ...rest }) => ({
                ...rest,
                category_id: categoryMap[category_name]
            }));
            // console.log(updatedProducts)

            for (let index = 0; index < updatedProducts.length; index++) {
                const element: any = updatedProducts[index];

                element.business_id = business._id

                for (let index = 0; index < element.sub_categories.length; index++) {
                    const element1 = element.sub_categories[index];
                    let item: any = {}
                    item.business_id = business._id
                    item.category_id = element.category_id
                    item.sub_category_name = element1.sub_category_name
                    item.description = element1.description
                    await saveSubCategoryItems(item)

                }

            }
            setMsg({ msg: "Product added!", state: "success" });
            setItem(initialState);
            setModalVisible(false);
            await onRefresh();

        } catch (error: any) {
            console.log(error)
            setMsg({ msg: error.message || " Error saving product.", state: "error" });
        } finally {
            setSaving(false);
        }
    };
    const filteredProducts = subCategories.filter(p => {
        const matchesSearch = p?.sub_category_name?.toLowerCase().includes(query?.toLowerCase());
        const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
        return matchesSearch && matchesCategory;
    });

    const renderCategoryCard = ({ item }: { item: any }) => (
        <SwipeableCard
            uniqueId={item.category_id}
            swipeRefs={swipeRefs}
            currentlyOpenSwipe={currentlyOpenSwipe}
            onEdit={() => { setItem(item); setModalVisible(true); }}
            onDelete={() => handleDelete(item)}
        >
            <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="grid-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.nameText, { color: colors.text }]}>{item?.sub_category_name}</Text>
                        <Text style={[styles.descText, { color: colors.subText }]} numberOfLines={1}>
                            {item?.description || "No description provided"}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </View>
            </TouchableOpacity>
        </SwipeableCard>
    );
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
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.category_id}
                                onPress={() => setSelectedCategoryId(cat.category_id)}
                                style={[styles.chip, { backgroundColor: selectedCategoryId === cat.category_id ? colors.primary : colors.card, borderColor: colors.border }]}
                            >
                                <Text style={[styles.chipText, { color: selectedCategoryId === cat.category_id ? '#fff' : colors.subText }]}>
                                    {cat.category_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            />
            {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.sub_category_id}
                renderItem={renderCategoryCard}

                contentContainerStyle={styles.listContent}
                onEndReached={() => loadData()}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ margin: 20 }} /> : null}
            />





            <AddSubCategory
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                item={item}
                setItem={setItem}
                categories={categories}
                PostLocally={handleAddSubCategory}
                onClose={() => setModalVisible(false)}
                msg={msg}
                setMsg={setMsg}
                loading={loading}
                isDarkMode={isDarkMode}
            />
            <UploadDataModal
                {...{ modalVisible: uploadModalVisible, setModalVisible: setUploadModalVisible, onRefresh, isDarkMode }}
            />

            <RadialFab
                mainColor={colors.primary}
                mainIcon="add-outline"
                actions={[
                    { icon: 'cube-outline', label: 'Product', onPress: () => setModalVisible(true) },
                    { icon: 'cloud-upload-outline', label: 'Import', onPress: () => setUploadModalVisible(true) },
                    { icon: 'sync-outline', label: 'Refresh', onPress: handleStaged },

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
        width: '100%',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        // Modern subtle shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    nameText: {
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 2
    },
    descText: {
        fontSize: 12,
        fontWeight: '500'
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600'
    },
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

export default SubCategoryScreen;