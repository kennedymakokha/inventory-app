import React from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../../context/themeContext";

type Header = {
  key: string;
  label: string;
  width?: number;
  align?: "left" | "center" | "right"; // Added alignment
};

interface Props {
  headers: Header[];
  data: Record<string, any>[];
  onEndReached?: () => void;
  onTablePressed?: (item: any) => void; // Pass item back
  loading?: boolean;
  horizontalScroll?: boolean;
  rowKey?: (item: Record<string, any>, index: number) => string;
  emptyComponent?: React.ReactNode;
}

const DEFAULT_COLUMN_WIDTH = 120;

const SalesReportTable: React.FC<Props> = ({
  headers,
  data,
  onEndReached,
  onTablePressed,
  loading = false,
  horizontalScroll = true,
  rowKey,
  emptyComponent,
}) => {
  const { colors } = useTheme();

  const tableWidth = headers.reduce(
    (sum, h) => sum + (h.width || DEFAULT_COLUMN_WIDTH),
    0
  );

  // --- Header ---
  const renderHeader = () => (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.background, // Matches page bg
        borderBottomWidth: 2,
        borderBottomColor: colors.primary + "40", // Subtle primary tint
      }}
    >
      {headers.map((h) => (
        <View
          key={h.key}
          style={{
            width: h.width || DEFAULT_COLUMN_WIDTH,
            paddingVertical: 14,
            paddingHorizontal: 12,
            alignItems: h.align === "right" ? "flex-end" : h.align === "center" ? "center" : "flex-start",
          }}
        >
          <Text
            style={{
              color: colors.subText,
              fontSize: 11,
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {h.label}
          </Text>
        </View>
      ))}
    </View>
  );

  // --- Row ---
  const renderRow = ({ item, index }: any) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => onTablePressed?.(item)}
        style={{
          flexDirection: "row",
          backgroundColor: colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border + "50",
        }}
      >
        {headers.map((h) => (
          <View
            key={h.key}
            style={{
              width: h.width || DEFAULT_COLUMN_WIDTH,
              paddingVertical: 16,
              paddingHorizontal: 12,
              justifyContent: "center",
              alignItems: h.align === "right" ? "flex-end" : h.align === "center" ? "center" : "flex-start",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: colors.text,
                fontSize: 14,
                fontWeight: h.key === "quantity" || h.key === "amount" ? "700" : "500",
                fontVariant: ['tabular-nums'], // Keeps numbers aligned
              }}
            >
              {item[h.key] ?? "-"}
            </Text>
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  const FooterLoader = () =>
    loading ? (
      <View style={{ padding: 30 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    ) : null;

  const getKey = (item: Record<string, any>, index: number) => {
    if (rowKey) return rowKey(item, index);
    return item.id ? String(item.id) : `row-${index}`;
  };

  const Empty = () => (
    <View style={{ padding: 40, alignItems: 'center' }}>
      {emptyComponent ?? (
        <Text style={{ color: colors.subText, fontWeight: '600' }}>No history records</Text>
      )}
    </View>
  );

  const TableContent = (
    <FlatList
      data={data}
      keyExtractor={getKey}
      ListHeaderComponent={renderHeader}
      stickyHeaderIndices={[0]}
      renderItem={renderRow}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={<FooterLoader />}
      ListEmptyComponent={<Empty />}
      showsVerticalScrollIndicator={false}
      // Optimizations
      removeClippedSubviews={true}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
    />
  );

  return horizontalScroll ? (
    <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        bounces={false}
    >
      <View style={{ width: tableWidth }}>{TableContent}</View>
    </ScrollView>
  ) : (
    TableContent
  );
};

export default SalesReportTable;