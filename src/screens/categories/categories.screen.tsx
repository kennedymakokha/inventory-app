import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    LayoutAnimation,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";

import { getDBConnection } from '../../services/db-service';
import { CategoryItem } from '../../../models';
import { getCategories, saveCategoryItems, softDeleteCategory, updateCategory } from '../../services/category.service';

import AddCategoryModal from './components/addCategoryModal';
import UploadProductsModal from './components/upload.modal';
import PageHeader from '../../components/pageHeader';
import RadialFab from '../../components/multiFab';
import { useSearch } from '../../context/searchContext';

import { useSelector } from 'react-redux';
import Toast from '../../components/Toast';
import SwipeableCard from '../../components/SwipeableCard';
import { validateItem } from '../validations/category.validation';
import { useTheme } from '../../context/themeContext';

const CategoryScreen = () => {
    const { query } = useSearch();
    const { user } = useSelector((state: any) => state.auth);
    const { business } = user;
    const { colors, isDarkMode } = useTheme();

    const initialState = {
        category_name: "",
        description: "",
        category_id: "",
        business_id: business._id
    };

    const swipeRefs = useRef<any>({});
    const currentlyOpenSwipe = useRef<any>(null);
    
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [item, setItem] = useState(initialState);
    const [msg, setMsg] = useState({ msg: "", state: "" });

    const loadCategories = async () => {
        setLoading(true);
        try {
            const db = await getDBConnection();
            const storedCategories = await getCategories(db);
            setCategories(storedCategories);
        } catch (err) {
            console.log("loadCategories error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCategories();
        setRefreshing(false);
    };

    const handleAddCategory = async () => {
        if (!validateItem(item, setMsg)) return;
        try {
            const db = await getDBConnection();
            if (item.category_id) {
                await updateCategory(item);
                swipeRefs.current[item.category_id]?.close();
                setMsg({ msg: "Category updated!", state: "success" });
            } else {
                await saveCategoryItems(db, item);
                setMsg({ msg: "Category added!", state: "success" });
            }
            setItem(initialState);
            setModalVisible(false);
            await onRefresh();
        } catch (err: any) {
            setMsg({ msg: err.message || "Error saving category.", state: "error" });
        }
    };

    const handleDelete = async (cat: CategoryItem) => {
        try {
            await softDeleteCategory(cat.category_id);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCategories(prev => prev.filter(c => c.category_id !== cat.category_id));
        } catch (err) {
            console.log(err);
        }
    };

    const filteredCategories = categories.filter(c =>
        c.category_name.toLowerCase().includes(query.toLowerCase())
    );

    const renderCategoryCard = ({ item }: { item: CategoryItem }) => (
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
                        <Text style={[styles.nameText, { color: colors.text }]}>{item?.category_name}</Text>
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
            <PageHeader />
            
            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredCategories}
                    keyExtractor={(item) => item.category_id}
                    renderItem={renderCategoryCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.subText }]}>
                                {query ? `No categories matching "${query}"` : "No categories found"}
                            </Text>
                        </View>
                    }
                />
            )}

            {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}

            <AddCategoryModal
                isDarkMode={isDarkMode}
                setMsg={setMsg}
                item={item}
                msg={msg}
                PostLocally={handleAddCategory}
                modalVisible={modalVisible}
                setItem={setItem}
                onClose={() => { setModalVisible(false); setItem(initialState) }}
                fetchCategories={onRefresh}
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
                mainIcon="apps-outline"
                radius={100}
                angle={90}
                actions={[
                    { icon: 'add-outline', label: 'New Category', onPress: () => setModalVisible(true) },
                    { icon: 'cloud-upload-outline', label: 'Bulk Import', onPress: () => setUploadModalVisible(true) },
                    { icon: 'sync-outline', label: 'Refresh', onPress: onRefresh },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { 
        paddingHorizontal: 16, 
        paddingTop: 16, 
        paddingBottom: 120 
    },
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
    }
});

export default CategoryScreen;