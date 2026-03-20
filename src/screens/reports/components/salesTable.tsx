import React from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../../context/themeContext";

type Header = {
  key: string;
  label: string;
  width?: number;
};

interface Props {
  headers: Header[];
  data: Record<string, any>[];
  onEndReached?: () => void;
  onTablePressed?: () => void;
  loading?: boolean;
  horizontalScroll?: boolean;
  rowKey?: (item: Record<string, any>) => string;
  emptyComponent?: React.ReactNode;
}

const DEFAULT_COLUMN_WIDTH = 150;

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
  const { colors, isDarkMode } = useTheme();

  const tableWidth = headers.reduce(
    (sum, h) => sum + (h.width || DEFAULT_COLUMN_WIDTH),
    0
  );

  // --- Header ---
  const renderHeader = () => (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.elevated,
      }}
    >
      {headers.map((h) => (
        <View
          key={h.key}
          style={{
            width: h.width || DEFAULT_COLUMN_WIDTH,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "bold",
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
    const rowBg = index % 2 === 0
      ? colors.card
      : colors.elevated;

    return (
      <TouchableOpacity onPress={onTablePressed}
        style={{
          flexDirection: "row",
          backgroundColor: rowBg,
        }}
      >
        {headers.map((h) => (
          <View
            key={h.key}
            style={{
              width: h.width || DEFAULT_COLUMN_WIDTH,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                flexShrink: 1,
              }}
            >
              {item[h.key] ?? ""}
            </Text>
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  // --- Footer Loader ---
  const FooterLoader = () =>
    loading ? (
      <View style={{ padding: 20 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    ) : null;

  // --- Key Extractor ---
  const getKey = (item: Record<string, any>, index: number) => {
    if (rowKey) return rowKey(item);
    if (item.id != null) return String(item.id);
    return `row-${index}`;
  };

  // --- Empty ---
  const Empty = () =>
    emptyComponent ?? (
      <Text
        style={{
          color: colors.subText,
          textAlign: "center",
          marginTop: 20,
        }}
      >
        No data available
      </Text>
    );

  // --- Render ---
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
    />
  );

  return horizontalScroll ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ width: tableWidth }}>{TableContent}</View>
    </ScrollView>
  ) : (
    TableContent
  );
};

export default SalesReportTable;