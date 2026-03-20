import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    LayoutAnimation,
    Platform,
    UIManager
} from "react-native";
import { SkeletonList } from "./components/skeleton";
import { useCallback, useEffect, useState } from "react";
import { getDBConnection } from "../../services/db-service";
import { useSearch } from "../../context/searchContext";
import PageHeader from "../../components/pageHeader";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SalesStackParamList } from "../../../models/navigationTypes";
import { getProductsGroupedByCategory } from "../../services/product.service";
import { useTheme } from "../../context/themeContext";

const LIMIT = 20;

if (Platform.OS === "android") {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function GroupedProductsForSale() {

    const navigation =
        useNavigation<NativeStackNavigationProp<SalesStackParamList>>();

    const { query } = useSearch();
    const { colors, isDarkMode } = useTheme();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [groupedProducts, setGroupedProducts] =
        useState<Record<string, any[]>>({});

    /* ---------------- FETCH PRODUCTS ---------------- */

    const loadProducts = useCallback(
        async (pageNumber = 0, append = false) => {
            try {
                const db = await getDBConnection();

                const offset = pageNumber * LIMIT;

                const results: any = await getProductsGroupedByCategory(
                    db,
                    LIMIT,
                    offset
                );

                if (append) {
                    setGroupedProducts((prev) => {
                        const merged = { ...prev };

                        Object.keys(results).forEach((cat) => {
                            if (!merged[cat]) merged[cat] = [];
                            merged[cat] = [...merged[cat], ...results[cat]];
                        });

                        return merged;
                    });
                } else {
                    setGroupedProducts(results);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        setLoading(true);
        loadProducts(0);
    }, []);

    /* ---------------- REFRESH ---------------- */

    const onRefresh = async () => {
        setRefreshing(true);
        setPage(0);
        loadProducts(0);
    };

    /* ---------------- PAGINATION ---------------- */

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadProducts(nextPage, true);
    };

    /* ---------------- SEARCH FILTER ---------------- */

    const filteredGrouped = Object.keys(groupedProducts).reduce((acc: any, key) => {
        const filtered = groupedProducts[key].filter((item: any) =>
            item.product_name?.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length) acc[key] = filtered;

        return acc;
    }, {});

    const categories = Object.keys(filteredGrouped);

    /* ---------------- TOGGLE CATEGORY ---------------- */

    const toggleCategory = (category: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        setExpandedCategory((prev) => (prev === category ? null : category));
    };

    /* ---------------- RENDER ---------------- */

    const renderCategory = ({ item }: any) => {
        const products = filteredGrouped[item] || [];
        const isOpen = expandedCategory === item;

        return (
            <View style={{ backgroundColor: colors.background }} className="mt-3">

                {/* CATEGORY HEADER */}

                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("Sales_Details", { category: item })
                    }
                    className="bg-gray-200 px-4 py-3 rounded flex-row justify-between items-center"
                >
                    <Text className="font-bold text-lg text-gray-800">
                        {item}
                    </Text>
                    <TouchableOpacity
                        onPress={() => toggleCategory(item)}
                        className="bg-gray-200 px-4 py-3 rounded flex-row justify-between items-center"
                    >
                        <Text className="text-gray-600">
                            {isOpen ? "▲" : "▼"}
                        </Text>
                    </TouchableOpacity>
                </TouchableOpacity>

                {/* PRODUCTS */}

                {isOpen && (
                    <View className="mt-2">

                        {products.map((product: any) => (
                            <TouchableOpacity
                                key={product.id}

                                className={`flex-row justify-between ${product.synced === 0 ? "bg-green-100" : "bg-green-50"
                                    } p-4 rounded-lg shadow-md mt-2`}
                            >
                                <View>
                                    <Text className="font-bold text-secondary-900 text-lg">
                                        {product.product_name}
                                    </Text>

                                    <Text className="text-gray-600">
                                        Stock: {product.quantity}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={{ backgroundColor: colors.background }} className="flex-1  px-5">

            <PageHeader />

            <View className="flex-1">

                {loading ? (
                    <SkeletonList />
                ) : (
                    <FlatList
                        data={categories}
                        keyExtractor={(item) => item}
                        renderItem={renderCategory}

                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}

                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }

                        ListEmptyComponent={() => (
                            <View className="items-center mt-10">
                                <Text className="text-gray-400">No products found</Text>
                            </View>
                        )}
                    />
                )}

            </View>
        </View>
    );
}