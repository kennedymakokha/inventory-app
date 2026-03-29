import React, { useMemo, useState } from "react";
import { View, Text, Dimensions, StyleSheet, Platform } from "react-native";
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop
} from "react-native-svg";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/themeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Generates a theme-safe color from a professional palette
 * Ensures contrast against colors.card and colors.background
 */
const getThemeAwareColor1 = (isDarkMode: boolean, index: number) => {
  const palette = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
  ];
  const color = palette[index % palette.length];
  // In dark mode, we add a touch of transparency to the lines for a "neon" glow effect
  return isDarkMode ? `${color}EE` : color;
};

interface DataPoint {
  key: string;
  value: number;
}

interface Dataset {
  label: string;
  data: DataPoint[];
}

interface MultiLineChartProps {
  datasets: Dataset[];
  title: string;
  startHour?: number;
  endHour?: number;
}

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  datasets = [],
  title,
  startHour = 8,
  endHour = 20
}) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useSelector((state: any) => state.auth);
  const [activePoint, setActivePoint] = useState<any>(null);

  const width = SCREEN_WIDTH - 32;
  const height = 240;
  const paddingX = 45;
  const paddingY = 40;

  const datasetColors = useMemo(() =>
    datasets.map((_, i:any) => getThemeAwareColor1(isDarkMode, i)),
    [isDarkMode, datasets]);

  const allValues = datasets.flatMap(ds => ds.data.map(d => d.value));
  const maxValue = Math.max(...allValues, 10);

  const labels = Array.from({ length: endHour - startHour + 1 }, (_, i) =>
    (startHour + i).toString().padStart(2, "0")
  );

  const stepX = (width - paddingX * 1.5) / (labels.length - 1);
  const scaleY = (val: number) => height - paddingY - ((val / maxValue) * (height - paddingY * 2));
  const scaleX = (index: number) => paddingX + index * stepX;

  const getSmoothPath = (points: any[]) => {
    if (points.length < 2) return "";
    return points.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const cp1x = a[i - 1].x + (p.x - a[i - 1].x) / 2;
      return `${acc} C ${cp1x},${a[i - 1].y} ${cp1x},${p.y} ${p.x},${p.y}`;
    }, "");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>

      <View style={styles.svgWrapper}>
        <Svg width={width} height={height}>
          <Defs>
            {datasetColors.map((color, i) => (
              <LinearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={color} stopOpacity="0.15" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.01" />
              </LinearGradient>
            ))}
          </Defs>

          {/* Y-AXIS GRID LINES - Uses border color with low opacity to prevent clashing */}
          {[0, 0.5, 1].map((v, i) => {
            const y = scaleY(maxValue * v);
            return (
              <React.Fragment key={i}>
                <Line x1={paddingX} y1={y} x2={width - 10} y2={y} stroke={colors.border} strokeDasharray="5,5" opacity={0.4} />
                <SvgText x={paddingX - 12} y={y + 4} fontSize="10" fontWeight="800" fill={colors.subText} textAnchor="end">
                  {Math.round(maxValue * v)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {datasets.map((dataset, dsIndex) => {
            const points = labels.map((hour, idx) => ({
              x: scaleX(idx),
              y: scaleY(dataset.data.find(d => d.key === hour)?.value || 0),
              value: dataset.data.find(d => d.key === hour)?.value || 0,
              label: dataset.label,
              hour
            }));

            const d = getSmoothPath(points);
            const areaD = `${d} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

            return (
              <React.Fragment key={dsIndex}>
                <Path d={areaD} fill={`url(#grad${dsIndex})`} />
                <Path d={d} fill="none" stroke={datasetColors[dsIndex]} strokeWidth={3} strokeLinecap="round" />

                {points.map((p, pIdx) => (
                  <Circle
                    key={`t-${pIdx}`} cx={p.x} cy={p.y} r={18} fill="transparent"
                    onPress={() => setActivePoint(p)}
                  />
                ))}
              </React.Fragment>
            );
          })}

          {/* X-AXIS LABELS */}
          {labels.filter((_, i) => i % 3 === 0).map((label, i) => (
            <SvgText key={i} x={scaleX(labels.indexOf(label))} y={height - 10} fontSize="10" fontWeight="800" fill={colors.subText} textAnchor="middle">
              {label}:00
            </SvgText>
          ))}
        </Svg>

        {/* THEME-AWARE TOOLTIP */}
        {activePoint && (
          <View style={[styles.tooltip, { backgroundColor: colors.background, borderColor: colors.border, left: activePoint.x - 50 }]}>
            <Text style={[styles.tooltipValue, { color: colors.text }]}>
              {user.role === 'admin' ? activePoint.value.toLocaleString() : '***'}
            </Text>
            <Text style={[styles.tooltipLabel, { color: colors.primary }]}>{activePoint.hour}:00 - {activePoint.label}</Text>
          </View>
        )}
      </View>

      {/* <View style={styles.legend}>
        {datasets.map((ds, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: datasetColors[i] }]} />
            <Text style={[styles.legendText, { color: colors.subText }]}>{ds.label}</Text>
          </View>
        ))}
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    marginVertical: 10,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  indicator: { width: 4, height: 16, borderRadius: 2, marginRight: 8 },
  title: { fontSize: 13, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 1 },
  svgWrapper: { alignItems: 'center', justifyContent: 'center' },
  tooltip: {
    position: 'absolute',
    top: 0,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipValue: { fontSize: 16, fontWeight: '900' },
  tooltipLabel: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, justifyContent: 'center', gap: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 11, fontWeight: '700' }
});

export default MultiLineChart;

export const getThemeAwareColor = (isDarkMode: boolean) => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65;
  const lightness = isDarkMode
    ? 60 + Math.random() * 15
    : 40 + Math.random() * 15;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
