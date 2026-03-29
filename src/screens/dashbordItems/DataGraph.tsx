import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useTheme } from "../../context/themeContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DataGraph = ({ data = [], title, pressed }: any) => {
  const chartHeight = 200;
  const { colors, isDarkMode } = useTheme();
  
  // Use a ref to store animated values to persist across re-renders
  const animatedValues = useRef<Animated.Value[]>([]).current;

  // Initialize animated values based on data
  if (animatedValues.length !== data.length) {
    data.forEach((_: any, i: number) => {
      if (!animatedValues[i]) animatedValues[i] = new Animated.Value(0);
    });
  }

  useEffect(() => {
    if (!data || data.length === 0) return;

    const animations = data.map((item: any, i: number) =>
      Animated.spring(animatedValues[i], {
        toValue: item.value,
        friction: 7,
        tension: 40,
        useNativeDriver: false,
      })
    );

    Animated.stagger(50, animations).start();
  }, [data]);

  const maxValue = Math.max(...data.map((item: any) => item?.value || 0), 1);

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={pressed} 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>

      {(!data || data.length === 0) ? (
        <View style={styles.emptyState}>
          <Text style={{ color: colors.subText, fontSize: 12 }}>No data available for this period</Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          {/* Y-AXIS LABELS */}
          <View style={styles.yAxis}>
            {[1, 0.5, 0].map((v, i) => (
              <Text key={i} style={[styles.axisText, { color: colors.subText }]}>
                {Math.round(maxValue * v)}
              </Text>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            <View>
              {/* GRID LINES (Background) */}
              <View style={[styles.gridLayer, { height: chartHeight }]}>
                {[0.25, 0.5, 0.75, 1].map((v, i) => (
                  <View 
                    key={i} 
                    style={[styles.gridLine, { 
                        bottom: chartHeight * v, 
                        borderTopColor: colors.primary,
                        opacity: isDarkMode ? 0.1 : 0.5 
                    }]} 
                  />
                ))}
              </View>

              {/* BARS LAYER */}
              <View style={[styles.barLayer, { height: chartHeight }]}>
                {data.map((item: any, index: number) => {
                  const height = animatedValues[index].interpolate({
                    inputRange: [0, maxValue],
                    outputRange: [0, chartHeight],
                  });

                  return (
                    <View key={index} style={styles.barColumn}>
                      <Animated.View
                        style={[
                          styles.bar,
                          { 
                            height, 
                            backgroundColor: colors.primaryLight,
                            borderColor: colors.card,
                            // Gradient effect: lighter top, solid bottom
                            opacity: animatedValues[index].interpolate({
                                inputRange: [0, maxValue],
                                outputRange: [0.3, 1]
                            })
                          },
                        ]}
                      >
                         <View style={styles.barTip} />
                      </Animated.View>
                      <Text numberOfLines={1} style={[styles.xLabel, { color: colors.subText }]}>
                        {item.key}
                      </Text>
                    </View>
                  );
                })}
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
    marginHorizontal: 4,
    marginVertical: 10,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  indicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxis: {
    height: 200,
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 20, // Align with bar bases
  },
  axisText: {
    fontSize: 9,
    fontWeight: '800',
  },
  gridLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  barLayer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  barColumn: {
    width: 45,
    alignItems: 'center',
    marginRight: 4,
  },
  bar: {
    width: 20,
    borderRadius: 6,
    justifyContent: 'flex-start',
  },
  barTip: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
  },
  xLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 8,
    width: 40,
    textAlign: 'center',
  },
  emptyState: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default DataGraph;