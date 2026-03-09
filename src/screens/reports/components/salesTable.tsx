import React from "react";
import { View, Text, FlatList, ScrollView, ActivityIndicator } from "react-native";

type Header = {
  key: string; // field name in data (must be unique)
  label: string; // column label
  width?: number; // optional custom column width
};

interface Props {
  headers: Header[];
  data: Record<string, any>[];
  onEndReached?: () => void;
  loading?: boolean;
  horizontalScroll?: boolean;
  rowKey?: (item: Record<string, any>) => string; // custom key extractor
  emptyComponent?: React.ReactNode;
}

const DEFAULT_COLUMN_WIDTH = 150;

const SalesReportTable: React.FC<Props> = ({
  headers,
  data,
  onEndReached,
  loading = false,
  horizontalScroll = true,
  rowKey,
  emptyComponent,
}) => {
  const tableWidth = headers.reduce(
    (sum, h) => sum + (h.width || DEFAULT_COLUMN_WIDTH),
    0
  );

  // --- Render Header ---
  const renderHeader = () => (
    <View style={{ flexDirection: "row", backgroundColor: "#1e293b" }}>
      {headers.map((h) => (
        <View
          key={h.key} // ✅ use unique header key
          style={{
            width: h.width || DEFAULT_COLUMN_WIDTH,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: "#334155",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>{h.label}</Text>
        </View>
      ))}
    </View>
  );

  // --- Render Row ---
  const renderRow = ({ item, index }: any) => {
    const rowColor = index % 2 === 0 ? "#0f172a" : "#1e293b";

    return (
      <View style={{ flexDirection: "row", backgroundColor: rowColor }}>
        {headers.map((h) => (
          <View
            key={h.key} // ✅ safe unique key per column
            style={{
              width: h.width || DEFAULT_COLUMN_WIDTH,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: "#334155",
            }}
          >
            <Text style={{ color: "white", flexShrink: 1 }}>
              {item[h.key] ?? ""}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // --- Footer Loader ---
  const FooterLoader = () =>
    loading ? (
      <View style={{ padding: 20 }}>
        <ActivityIndicator size="small" color="white" />
      </View>
    ) : null;

  // --- Key Extractor for FlatList ---
  const getKey = (item: Record<string, any>, index: number) => {
    if (rowKey) return rowKey(item);
    if (item.id != null) return String(item.id); // use unique id if available
    return `row-${index}`; // fallback to index if nothing else
  };

  // --- Main Table Rendering ---
  return horizontalScroll ? (
    <ScrollView horizontal>
      <View style={{ width: tableWidth }}>
        <FlatList
          data={data}
          keyExtractor={getKey}
          ListHeaderComponent={renderHeader}
          stickyHeaderIndices={[0]}
          renderItem={renderRow}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={<FooterLoader />}
          ListEmptyComponent={() =>
            emptyComponent ?? (
              <Text
                style={{ color: "white", textAlign: "center", marginTop: 20 }}
              >
                No data available
              </Text>
            )
          }
        />
      </View>
    </ScrollView>
  ) : (
    <FlatList
      data={data}
      keyExtractor={getKey}
      ListHeaderComponent={renderHeader}
      stickyHeaderIndices={[0]}
      renderItem={renderRow}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={<FooterLoader />}
      ListEmptyComponent={() =>
        emptyComponent ?? (
          <Text style={{ color: "white", textAlign: "center", marginTop: 20 }}>
            No data available
          </Text>
        )
      }
    />
  );
};

export default SalesReportTable;