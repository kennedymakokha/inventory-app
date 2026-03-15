import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    LayoutAnimation,
    RefreshControl
} from 'react-native';

import { getDBConnection } from '../../services/db-service';
import { CategoryItem } from '../../../models';
import { getCategories, saveCategoryItems, updateCategory, softDeleteCategory } from '../../services/category.service';

import AddCategoryModal from './components/addCategoryModal';
import UploadProductsModal from './components/upload.modal';
import PageHeader from '../../components/pageHeader';
import RadialFab from '../../components/multiFab';
import { useSearch } from '../../context/searchContext';
import { useSettings } from '../../context/SettingsContext';
import { useSelector } from 'react-redux';
import Toast from '../../components/Toast';
import SwipeableCard from '../../components/SwipeableCard';
import { validateItem } from '../validations/category.validation';
import { Theme } from '../../utils/theme';

const CategoryScreen = () => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;
    const { query } = useSearch();
    const { user } = useSelector((state: any) => state.auth);
    const { business } = user;

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

    // Load categories
    const loadCategories = async () => {
        setLoading(true);
        try {
            const db = await getDBConnection();
            const storedCategories = await getCategories(db);
            setCategories(storedCategories);
        } catch (err) {
            console.log(" loadCategories error:", err);
        }
        setLoading(false);
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
            setMsg({ msg: err.message || " Error saving category.", state: "error" });
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
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
                <Text style={[styles.nameText, { color: theme.text }]}>{item?.category_name}</Text>
                <Text style={{ color: theme.subText, fontSize: 12, marginTop: 4 }}>
                    {item?.description || ""}
                </Text>
            </TouchableOpacity>
        </SwipeableCard>
    );
    console.log("New Cat", item)
    return (
        <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: 16 }}>
            <PageHeader
                component={() => (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContainer}
                        style={{ flexGrow: 0 }}
                    >
                        {/* Add any category filters here if needed */}
                    </ScrollView>
                )}
            />

            <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item.category_id}
                renderItem={renderCategoryCard}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 12 }}
                onEndReachedThreshold={0.5}
                onEndReached={loadCategories}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />

            {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}

            <AddCategoryModal
                isDarkMode={isDarkMode}
                setMsg={setMsg}
                item={item}
                msg={msg}
                PostLocally={handleAddCategory}
                modalVisible={modalVisible}
                setItem={setItem}
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
                mainColor={Theme.primary}
                mainIcon="menu"
                radius={120}
                angle={90}
                actions={[
                    { icon: 'add-outline', label: 'Add Category', onPress: () => setModalVisible(true) },
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
    card: {
        width: '100%',
        padding: 14,
        borderRadius: 5,
        marginBottom: 16,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 6,
    },
    nameText: {
        fontWeight: '700',
        fontSize: 14,
    }
});

export default CategoryScreen;