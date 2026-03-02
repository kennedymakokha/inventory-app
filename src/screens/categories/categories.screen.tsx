import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

import { getDBConnection } from '../../services/db-service';
import { CategoryItem, ProductItem } from '../../../models';
import { createCategoryTable, getCategories, getSyncedCategories, getUnsyncedCategories, saveCategoryItems } from '../../services/category.service';

import AddCategoryModal from './components/addCategoryModal';
import UploadProductsModal from './components/uploadProduct.modal';
import { validateItem } from '../validations/category.validation';
import PageHeader from '../../components/pageHeader';
import { createInventoryTable } from '../../services/inventory.service';

import { useSearch } from '../../context/searchContext';

import RadialFab from '../../components/multiFab';
import { useCreateCategoryMutation } from '../../services/categoryApi';
import { useSettings } from '../../context/SettingsContext';
import { useSelector } from 'react-redux';
import EntityModal from '../../components/EntityModal';
import SwipeableCard from '../../components/SwipeableCard';

const CategoryScreen = () => {
    const { isDarkMode } = useSettings();
    const { query, setQuery } = useSearch();
    const { user:{business} } = useSelector((state: any) => state.auth)
    const initialState = { category_name: "", description: "", category_id: "",business_id: business._id || "" };

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [item, setItem] = useState(initialState);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [offset, setOffset] = useState(10);

    const [postCategoryToMongoDB] = useCreateCategoryMutation();

    const loadDataCallback = useCallback(async (offset = 0, filter = 'all') => {
        try {
            setLoading(true);
            const db = await getDBConnection();
            await createCategoryTable(db);
            await createInventoryTable(db);

            let storedItems: CategoryItem[] = [];
            if (filter === 'all') storedItems = await getCategories(db);
            if (filter === 'synced') storedItems = await getSyncedCategories(db, offset);
            if (filter === 'unsynced') storedItems = await getUnsyncedCategories(db, offset);

            setCategories(storedItems);
        } catch (error) {
            console.error('❌ Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDataCallback(0);
        setRefreshing(false);
    };

    const AddCategory = async () => {
        if (!validateItem(item, setMsg)) return;
        try {
            const db = await getDBConnection();
            await createCategoryTable(db);
            const storedItems = await saveCategoryItems(db, item, postCategoryToMongoDB);
            setCategories(storedItems);

            setItem(initialState);
            setModalVisible(false);
            setMsg({ msg: '✅ Category added!', state: 'success' });
        } catch (error: any) {
            setMsg({ msg: error.message || '❌ Could not add category.', state: 'error' });
        }
    };

    useEffect(() => {
        loadDataCallback(offset);
    }, [loadDataCallback, offset]);


// Inside CategoryScreen
const categoryFields = [
    { key: 'category_name', label: 'Name', placeholder: 'Category Name' },
    { key: 'description', label: 'Description', placeholder: 'Description' },
];
 const handleDelete = async (cat: CategoryItem) => {
        const db = await getDBConnection();
        await db.executeSql('DELETE FROM categories WHERE category_id=?', [cat.category_id]);
        setCategories(prev => prev.filter(c => c.category_id !== cat.category_id));
    };
const renderCategoryCard = ({ item }: { item: CategoryItem }) => (
    <SwipeableCard
        onEdit={() => { setItem(item); setModalVisible(true); }}
        onDelete={() => handleDelete(item)}
    >
        <View style={{
            backgroundColor: '#1e293b',
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
        }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{item.category_name}</Text>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 6 }}>{item.description || ''}</Text>
        </View>
    </SwipeableCard>
);

// Reusable modal for add/edit
<EntityModal
    visible={modalVisible}
    onClose={() => setModalVisible(false)}
    onSave={AddCategory} // works for both add & edit
    initialData={item}
    fields={categoryFields}
/>
    // const renderCategoryCard = ({ item }: { item: CategoryItem }) => {
    //     // threshold for low stock
    //     return (
    //         <View style={{
    //             backgroundColor: '#1e293b',
    //             padding: 16,
    //             borderRadius: 12,
    //             marginBottom: 12,
    //             shadowColor: "#000",
    //             shadowOffset: { width: 0, height: 2 },
    //             shadowOpacity: 0.25,
    //             shadowRadius: 4,
    //             elevation: 5
    //         }}>
    //             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    //                 <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{item.category_name}</Text>

    //             </View>
    //             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>

    //                 <Text style={{ color: '#9ca3af', fontSize: 12 }}>{item.description ? ` ${item.description}` : ''}</Text>
    //             </View>
    //         </View>
    //     );
    // };

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', paddingTop: 16 }}>
            {/* Page Header */}
            <PageHeader />

            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>

                {/* {loading ? (
          <SkeletonList />
        ) : ( */}
                <FlatList
                    contentContainerStyle={{ paddingBottom: 120 }}
                    data={categories.filter(p => p.category_name.toLowerCase().includes(query.toLowerCase()))}
                    keyExtractor={(item, index) => String(item.id || item.category_name || index)}
                    renderItem={renderCategoryCard}
                    onEndReached={() => setOffset(prev => prev + 10)}
                    onEndReachedThreshold={0.5}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
                {/* )} */}
            </View>

            {/* Modals */}
            <AddCategoryModal
                setMsg={setMsg}
                isDarkMode={isDarkMode}
                msg={msg}
                PostLocally={AddCategory}
                modalVisible={modalVisible}
                setItem={setItem}
                fetchProducts={loadDataCallback}
                item={item}
                setModalVisible={setModalVisible}
            />
            <UploadProductsModal
                setMsg={setMsg}
                msg={msg}
                PostLocally={AddCategory}
                modalVisible={uploadModalVisible}
                setItem={setItem}
                fetchProducts={loadDataCallback}
                item={item}
                setModalVisible={setUploadModalVisible}
            />

            {/* Floating Action Buttons */}
            {/* Multi Action FAB */}
            <RadialFab
                mainColor="#1e293b"
                mainIcon="menu"
                radius={120}    // how far buttons spread
                angle={90}      // fan angle
                actions={[
                    { icon: 'add-outline', label: 'Add Product', onPress: () => setModalVisible(true) },
                    { icon: 'cloud-upload-outline', label: 'Upload', onPress: () => setUploadModalVisible(true) },
                    { icon: 'settings-outline', label: 'Settings', onPress: () => console.log('Settings') },
                ]}
            />
        </View>
    );
};

export default CategoryScreen;