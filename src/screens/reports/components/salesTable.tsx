import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';

import { useSelector } from 'react-redux';
import { useSettings } from '../../../context/SettingsContext';
import { Theme } from '../../../utils/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

const TableContainer = ({
  headers,
  data
}: {
  headers: { label: string; key: string }[];
  data: Record<string, any>[];
}) => {
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;
  const columnWidth = 150;
  const tableWidth = columnWidth * headers.length;

  // Pad data to always show 10 rows
  const paddedData = [...data];
  while (paddedData.length < 10) {
    paddedData.push({});
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <ScrollView horizontal>
        <View style={{ minWidth: tableWidth }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.elevated }}>
            {headers.map((header, index) => (
              <View
                key={index}
                style={{
                  width: columnWidth,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ fontWeight: 'bold', color: theme.text }}>
                  {header.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {paddedData.map((row, rowIndex) => {
            const rowBackground =
              rowIndex % 2 === 0 ? theme.card : theme.elevated;
            return (
              <View
                key={rowIndex}
                style={{ flexDirection: 'row', backgroundColor: rowBackground }}
              >
                {headers.map((header, cellIndex) => (
                  <View
                    key={cellIndex}
                    style={{
                      width: columnWidth,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Text
                      style={{ color: theme.text }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {row[header.key]}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

export default TableContainer;