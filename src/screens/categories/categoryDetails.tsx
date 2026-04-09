import { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/themeContext';
import { getDBConnection } from '../../services/db-service';
import { getCategoryFullDetails } from '../../services/product.service';
import RadialFab from '../../components/multiFab';
import AddSubCategory from '../subCategory/components/addModal';
import { useSelector } from 'react-redux';
import { validateItem } from '../validations/Subcategory.validation';
import { saveSubCategoryItems, updateSubCategory } from '../../services/category.service';

const CategoryDetailsScreen = ({ route, navigation }: any) => {
    const { category } = route.params;
    const { user } = useSelector((state: any) => state.auth);
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const { business } = user;
    const initialState = {
        sub_category_name: "",
        category_id: category.category_id,
        business_id: business._id,
        description: ""

    };
    const { colors, isDarkMode } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [showProducts, setShowProducts] = useState(false);
    const [data, setSubCategories] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [item, setItem] = useState<any>(initialState);
    const [saving, setSaving] = useState(false);
    const fetchSubCategories = useCallback(async () => {
        setLoading(true);
        try {
            const db = await getDBConnection();
            const data: any = await getCategoryFullDetails(db, category.category_id);
            setSubCategories(data);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [category.category_id]);

    useEffect(() => { fetchSubCategories(); }, [fetchSubCategories]);

    const renderHeader = () => (
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconLarge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="apps" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{category.category_name}</Text>
            <Text style={[styles.description, { color: colors.subText }]}>
                {category.description || "No category description available."}
            </Text>

            <View style={styles.statsRow}>
                <TouchableOpacity onPress={() => setShowProducts(false)} activeOpacity={0.7} style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{data?.subCategories?.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.subText }]}>Sub-Categories</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowProducts(true)} style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{data?.products?.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.subText }]}>Products</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
    const handleAddCategory = async () => {
        if (saving) return;
        if (!validateItem(item, setMsg)) return;

        try {
            setSaving(true);
            if (item.product_id) {
                await updateSubCategory(item);

                setMsg({ msg: "Product updated!", state: "success" });
            } else {
                item.business_id = business._id
                await saveSubCategoryItems(item)
                setMsg({ msg: "Product added!", state: "success" });
            }
            setItem(initialState);
            setModalVisible(false);
            await fetchSubCategories();
        } catch (error: any) {
            setMsg({ msg: error.message || "Error saving product.", state: "error" });
        } finally {
            setSaving(false);
        }
    };
    const renderSubCategory = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.subCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {/* Navigate to items in this sub-cat */ }}
        >
            <View style={styles.subCardInfo}>
                <View style={[styles.subIcon, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="list-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.subName, { color: colors.text }]}>{item.sub_category_name}</Text>
                    <Text style={[styles.subDesc, { color: colors.subText }]} numberOfLines={1}>
                        {item.description}
                    </Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
        </TouchableOpacity>
    );
    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.subCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {/* Navigate to items in this sub-cat */ }}
        >
            <View style={styles.subCardInfo}>
                <View style={[styles.subIcon, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="list-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.subName, { color: colors.text }]}>{item.product_name}</Text>
                    <Text style={[styles.subDesc, { color: colors.subText }]} numberOfLines={1}>
                        {item.description}
                    </Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
        </TouchableOpacity>
    );
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                data={showProducts ? data?.products : data?.subCategories}
                keyExtractor={(item) => item.category_id}
                ListHeaderComponent={renderHeader}
                renderItem={showProducts ? renderProduct : renderSubCategory}
                contentContainerStyle={styles.listPadding}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchSubCategories} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: colors.subText }}>No sub-categories found</Text>
                        </View>
                    ) : null
                }
            />

            <AddSubCategory
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                item={item}
                setItem={setItem}
                //    CateList={}
                PostLocally={handleAddCategory}
                onClose={() => setModalVisible(false)}
                msg={msg}
                setMsg={setMsg}
                loading={loading}
                isDarkMode={isDarkMode}
            />
            <RadialFab
                mainColor={colors.primary}
                mainIcon="add-outline"
                mainAction={() => setModalVisible(true)}
                radius={100}
                angle={90}
                actions={[
                    // { icon: 'add-outline', label: 'New Category', onPress: () => setModalVisible(true) },
                    // { icon: 'cloud-upload-outline', label: 'Bulk Import', onPress: () => setUploadModalVisible(true) },
                    // { icon: 'sync-outline', label: 'Refresh', onPress: onRefresh },
                    // { icon: 'sync-outline', label: 'Refresh', onPress: handleStagedCategory },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 10
    },
    backBtn: { padding: 8 },
    editBtn: { padding: 8 },
    navTitle: { fontSize: 18, fontWeight: '700' },
    listPadding: { paddingHorizontal: 16, paddingBottom: 40 },
    headerCard: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginVertical: 16,
        borderWidth: 1,
        elevation: 2,
    },
    iconLarge: {
        width: 80,
        height: 80,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
    description: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
    statsRow: {
        flexDirection: 'row',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        width: '100%'
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '800' },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    statDivider: { width: 1, height: '80%' },
    subCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 15,
        marginBottom: 10,
        borderWidth: 1,
    },
    subCardInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    subIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    subName: { fontSize: 15, fontWeight: '700' },
    subDesc: { fontSize: 12, marginTop: 2 },
    emptyContainer: { alignItems: 'center', marginTop: 40 }
});

export default CategoryDetailsScreen;