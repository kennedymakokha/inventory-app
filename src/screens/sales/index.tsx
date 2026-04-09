import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    LayoutAnimation,
    StatusBar,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SkeletonList } from "./components/skeleton";
import { getDBConnection } from "../../services/db-service";
import { useSearch } from "../../context/searchContext";
import PageHeader from "../../components/pageHeader";
import { SalesStackParamList } from "../../../models/navigationTypes";
import { getProductsGroupedByHierarchy } from "../../services/product.service";
import { useTheme } from "../../context/themeContext";
import { RootState } from "../../../store";

const LIMIT = 20;

export default function GroupedProductsForSale() {
    const navigation = useNavigation<NativeStackNavigationProp<SalesStackParamList>>();
    const { items: cart } = useSelector((state: RootState) => state.cart);
    const { query } = useSearch();
    const { colors, isDarkMode } = useTheme();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [products, setProducts] = useState<any[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null);

    /* ---------------- FETCH LOGIC (UNCHANGED) ---------------- */
    const loadProducts = useCallback(async (pageNumber = 0, append = false) => {
        try {
            const db = await getDBConnection();
            const offset = pageNumber * LIMIT;
            const results = await getProductsGroupedByHierarchy(db, LIMIT, offset);
            setProducts(prev => append ? [...prev, ...results] : results);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        loadProducts(0);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(0);
        loadProducts(0);
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadProducts(nextPage, true);
    };

    /* ---------------- MEMOIZED HIERARCHY ---------------- */
    const hierarchy = useMemo(() => {
        const filtered = products.filter(p =>
            p.product_name?.toLowerCase().includes(query.toLowerCase())
        );

        return filtered.reduce((acc: any, product: any) => {
            const catId = String(product.category_id || "unknown_cat");
            const catName = product.category_name || "Uncategorized";
            const subId = String(product.sub_category_id || "unknown_sub");
            const subName = product.sub_category_name || "General";

            if (!acc[catId]) acc[catId] = { name: catName, subCategories: {} };
            if (!acc[catId].subCategories[subId]) acc[catId].subCategories[subId] = { name: subName, products: [] };
            acc[catId].subCategories[subId].products.push(product);
            return acc;
        }, {});
    }, [products, query]);

    const categories = useMemo(() => Object.keys(hierarchy), [hierarchy]);

    /* ---------------- UI HELPERS ---------------- */
    const toggleCategory = (categoryId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
        setExpandedSubCategory(null);
    };

    const toggleSubCategory = (subId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSubCategory((prev) => (prev === subId ? null : subId));
    };

    /* ---------------- RENDERERS ---------------- */
    const renderCategory = ({ item: categoryId }: { item: string }) => {
        const category = hierarchy[categoryId];
        const subCategories = category.subCategories;
        const isCatOpen = expandedCategory === categoryId;

        return (
            <View 
                style={{ backgroundColor: colors.card, borderColor: colors.border }} 
                className="mb-4 overflow-hidden rounded-3xl border shadow-sm"
            >
                {/* CATEGORY HEADER */}
                <View className="flex-row items-center ">
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Sales_Details", {
                            category_id: categoryId,
                            filterType: "category",
                            name: category.name,
                        })}
                        className="flex-1 p-5 flex-row items-center"
                    >
                        <View style={{ backgroundColor: colors.primary + '15' }} className="p-2 rounded-xl mr-3">
                            <Ionicons name="layers-outline" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={{ color: colors.text }} className="font-extrabold text-base uppercase tracking-tight">
                                {category.name}
                            </Text>
                            <Text style={{ color: colors.subText }} className="text-[10px] font-bold">
                                {Object.keys(subCategories).length} SECTORS
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => toggleCategory(categoryId)}
                        className="p-5"
                    >
                        <Ionicons 
                            name={isCatOpen ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={isCatOpen ? colors.primary : colors.subText} 
                        />
                    </TouchableOpacity>
                </View>

                {/* SUBCATEGORIES SECTION */}
                {isCatOpen && (
                    <View style={{ backgroundColor: isDarkMode ? '#00000020' : '#F9FAFB' }} className="px-3 pb-3">
                        {Object.keys(subCategories).map((subId) => {
                            const sub = subCategories[subId];
                            const isSubOpen = expandedSubCategory === subId;
                            const subProducts = sub.products;

                            return (
                                <View key={subId} style={{ borderColor: colors.border }} className="mt-2 border bg-transparent">
                                    <TouchableOpacity
                                        onPress={() => toggleSubCategory(subId)}
                                        className="flex-row justify-between items-center p-4"
                                    >
                                        <Text style={{ color: colors.text }} className="font-bold text-sm">
                                            {sub.name}
                                        </Text>
                                        <View className="flex-row items-center gap-x-2">
                                            <Text style={{ color: colors.subText }} className="text-xs font-bold">
                                                {subProducts.length} items
                                            </Text>
                                            <Ionicons name={isSubOpen ? "remove" : "add"} size={18} color={colors.primary} />
                                        </View>
                                    </TouchableOpacity>

                                    {/* PRODUCTS LIST */}
                                    {isSubOpen && (
                                        <View className="px-2 pb-2">
                                            {subProducts.map((product: any) => (
                                                <TouchableOpacity
                                                    key={product.id}
                                                    onPress={() => navigation.navigate("Sales_Details", {
                                                        productId: product.id,
                                                        filterType: "product",
                                                        name: product.product_name
                                                    })}
                                                    style={{ backgroundColor: colors.background }}
                                                    className="flex-row justify-between items-center p-4 mb-1  "
                                                >
                                                    <View className="flex-1">
                                                        <Text style={{ color: colors.text }} className="font-bold text-sm">
                                                            {product.product_name}
                                                        </Text>
                                                        <Text style={{ color: colors.subText }} className="text-[10px] uppercase font-bold tracking-widest">
                                                            SKU: {product.product_code || "N/A"}
                                                        </Text>
                                                    </View>

                                                    <View className="items-end">
                                                        <Text style={{ color: colors.primary }} className="font-black text-sm">
                                                            KSh {product.selling_price}
                                                        </Text>
                                                        <Text style={{ color: product.quantity < 5 ? '#EF4444' : colors.subText }} className="text-[10px] font-bold">
                                                            QTY: {product.quantity}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={{ backgroundColor: colors.background }} className="flex-1">
          
            <PageHeader  />

            <View className="flex-1 px-4 pt-2">
                {loading ? (
                    <SkeletonList />
                ) : (
                    <FlatList
                        data={categories}
                        keyExtractor={(item) => item}
                        renderItem={renderCategory}
                        onEndReached={loadMore}
                        showsVerticalScrollIndicator={false}
                        onEndReachedThreshold={0.5}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={
                            <RefreshControl 
                                refreshing={refreshing} 
                                onRefresh={onRefresh} 
                                tintColor={colors.primary}
                            />
                        }
                        ListEmptyComponent={() => (
                            <View className="items-center mt-20">
                                <Ionicons name="search-outline" size={48} color={colors.border} />
                                <Text style={{ color: colors.subText }} className="mt-4 font-bold">No products found</Text>
                            </View>
                        )}
                    />
                )}
            </View>

            {/* FLOATING CART BUTTON */}
            {cart.length > 0 && (
                <TouchableOpacity
                    onPress={() => navigation.navigate("Sales_Details" as any)}
                    style={{ backgroundColor: colors.primary, shadowColor: colors.primary }}
                    className="absolute bottom-8 left-6 right-6 h-16 rounded-2xl flex-row items-center justify-between px-6 shadow-xl"
                >
                    <View className="flex-row items-center gap-x-3">
                        <View className="bg-white/20 p-2 rounded-lg">
                            <Ionicons name="cart" size={20} color="#fff" />
                        </View>
                        <Text className="text-white font-black text-base uppercase tracking-wider">
                            {cart.length} ITEMS
                        </Text>
                    </View>
                    <Text className="text-white font-bold">CHECKOUT →</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}