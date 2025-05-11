import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TableContainer = ({
  headers,
  data
}: {
  headers: { label: string; key: string }[];
  data: Record<string, any>[];
}) => {
  const columnWidth = 150;
  const tableWidth = columnWidth * headers.length;
  const paddedData = [...data];
  while (paddedData.length < 10) {
    paddedData.push({});
  }
  return (
    <ScrollView className='bg-slate-900' style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ScrollView  horizontal>
        <View style={{ minWidth: tableWidth }}>
          {/* Header */}
          <View className="flex-row bg-gray-200">
            {headers.map((header, index) => (
              <View
                key={index}
                style={{ width: columnWidth }}
                className="p-3 border border-gray-300"
              >
                <Text className="font-bold text-black">{header.label}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {paddedData.map((row, rowIndex) => (
            <View
              key={rowIndex}
              className={`flex-row ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-green-50'}`}
            >
              {headers.map((header, cellIndex) => (
                <View
                  key={cellIndex}
                  style={{ width: columnWidth }}
                  className="p-3 border border-gray-200"
                >
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {row[header.key]}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

export default TableContainer;
