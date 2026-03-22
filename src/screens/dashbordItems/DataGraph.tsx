import { View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity } from "react-native";
import React, { useEffect, useRef } from "react";
import { useSettings } from "../../context/SettingsContext";
import { Theme } from "../../utils/theme";
import { getThemeAwareColor } from "./lineGraph";
import { useTheme } from "../../context/themeContext";

const DataGraph = ({ data = [], title, pressed }: any) => {

  const chartHeight = 220;
  const { colors, isDarkMode } = useTheme();
  // Keep Animated.Values in a ref
  const animatedValuesRef = useRef<Animated.Value[]>([]);

  // Sync animatedValues with data length
  if (animatedValuesRef.current.length !== data.length) {
    animatedValuesRef.current = data.map(
      (_: any, i: any) => animatedValuesRef.current[i] || new Animated.Value(0)
    );
  }

  useEffect(() => {
    if (!data || data.length === 0) return;

    const animations = data.map((item: any, i: any) =>
      Animated.timing(animatedValuesRef.current[i], {
        toValue: item.value,
        duration: 600,
        useNativeDriver: false,
      })
    );

    Animated.stagger(80, animations).start();
  }, [data]);

  const maxValue = Math.max(...data.map((item: any) => item?.value || 0), 1);

  return (
    <TouchableOpacity activeOpacity={1} onPress={pressed} style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primaryLight }]}>{title}</Text>

      {(!data || data.length === 0) ? (
        <Text style={{ color: colors.text, textAlign: "center", marginTop: 40 }}>
          No data available
        </Text>
      ) : (
        <View style={styles.chartRow}>
          {/* Y Axis */}
          <View style={styles.yAxis}>
            {[1, 0.75, 0.5, 0.25, 0].map((v, i) => (
              <Text key={i} style={[styles.yAxisText, { color: colors.text }]}>
                {Math.round(maxValue * v)}
              </Text>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ paddingRight: 10 }}>
              {/* Grid Lines */}
              <View style={styles.gridContainer}>
                {[1, 0.75, 0.5, 0.25].map((g, i) => (
                  <View
                    key={i}
                    style={[
                      styles.gridLine,
                      { top: chartHeight * (1 - g), borderColor: colors.border },
                    ]}
                  />
                ))}
              </View>

              {/* Bars */}
              <View style={[styles.chartContainer, { borderColor: colors.border, height: chartHeight }]}>
                {data.map((item: any, index: number) => {
                  const barHeight = animatedValuesRef.current[index].interpolate({
                    inputRange: [0, maxValue],
                    outputRange: [0, chartHeight],
                  });

                  return (
                    <View key={index} style={styles.barWrapper}>
                      <Text style={[styles.valueText, { color: colors.text }]}>{item.value}</Text>
                      <Animated.View
                        style={[
                          styles.bar,
                          { height: barHeight, backgroundColor: getThemeAwareColor(isDarkMode) },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>

              {/* X Axis */}
              <View style={[styles.xAxis, { backgroundColor: colors.border }]} />

              {/* Labels */}
              <View style={styles.labelRow}>
                {data.map((item: any, index: number) => (
                  <Text key={index} style={[styles.label, { color: colors.text }]}>
                    {item.key}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 18,
    textAlign: "center",
  },
  chartRow: {
    flexDirection: "row",
  },
  yAxis: {
    justifyContent: "space-between",
    height: 220,
    marginRight: 8,
  },
  yAxisText: {
    fontSize: 11,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderLeftWidth: 1,
  },
  barWrapper: {
    width: 40,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 26,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  valueText: {
    fontSize: 11,
    marginBottom: 4,
  },
  xAxis: {
    height: 1,
    marginTop: 2,
  },
  labelRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  label: {
    width: 40,
    textAlign: "center",
    fontSize: 11,
    transform: [{ rotate: "-35deg" }],
  },
  gridContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 220,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
});

export default DataGraph;