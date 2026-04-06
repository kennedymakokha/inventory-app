import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Dimensions, TouchableOpacity } from "react-native";
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop
} from "react-native-svg";
import { useSettings } from "../../context/SettingsContext";
import { Theme } from "../../utils/theme";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/themeContext";
import getInitials from "../../utils/initials";
import Icon from "react-native-vector-icons/Ionicons";
import { Animated } from "react-native";
interface DataPoint {
  key: string;
  value: number;
}

interface Dataset {
  label: string;
  color?: string;
  data: DataPoint[];
}

interface LineGraphProps {
  datasets: Dataset[];
  title: string;
  startHour?: number; // optional business start hour
  endHour?: number;   // optional business end hour
}

const { width: screenWidth } = Dimensions.get("window");

export const getThemeAwareColor = (isDarkMode: boolean) => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65;
  const lightness = isDarkMode
    ? 60 + Math.random() * 15
    : 40 + Math.random() * 15;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const MultiLineChart: React.FC<LineGraphProps> = ({
  datasets = [],
  title,
  startHour,
  endHour
}) => {
  const { colors, isDarkMode } = useTheme();

  const {
    user: { role }
  } = useSelector((state: any) => state.auth);

  const [tooltip, setTooltip] = useState<any>(null);
  const [showLegend, setShowLegend] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const hideTimer = useRef<any>(null);
  const hideLegend = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 250,
        useNativeDriver: true
      })
    ]).start(() => {
      setShowLegend(false);
    });
  };
  useEffect(() => {
    if (showLegend) {
      // animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      // auto hide after 2 minutes
      hideTimer.current && clearTimeout(hideTimer.current);

      hideTimer.current = setTimeout(() => {
        hideLegend();
      }, 6000);
    }

    return () => {
      hideTimer.current && clearTimeout(hideTimer.current);
    };
  }, [showLegend]);
  const width = screenWidth - 70;
  const height = 220;
  const padding = 28; // extra space for Y labels

  const datasetColors = useMemo(() => {
    return datasets.map(ds => ds.color ?? getThemeAwareColor(isDarkMode));
  }, [datasets, isDarkMode]);

  if (!datasets.length) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: colors.text }}>{title}</Text>
        <Text style={{ color: colors.text }}>No data available</Text>
      </View>
    );
  }

  const allValues = datasets.flatMap(ds => ds.data.map(d => d.value));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);

  // Dynamic X-axis hours
  const start = startHour ?? 0;
  const end = endHour ?? 23;
  const labels = Array.from({ length: end - start + 1 }, (_, i) =>
    (start + i).toString().padStart(2, "0")
  );

  const stepX = (width - padding * 2) / (labels.length - 1);

  const scaleY = (value: number) =>
    height -
    padding -
    ((value - minValue) / (maxValue - minValue || 1)) *
    (height - padding * 2);

  const buildSmoothPath = (points: any[]) => {
    if (!points.length) return "";

    // 🚨 filter invalid points
    const validPoints = points.filter(
      p => !isNaN(p.x) && !isNaN(p.y)
    );

    if (validPoints.length < 2) return "";

    let d = `M ${validPoints[0].x} ${validPoints[0].y}`;

    for (let i = 0; i < validPoints.length - 1; i++) {
      const p1 = validPoints[i];
      const p2 = validPoints[i + 1];

      const xMid = (p1.x + p2.x) / 2;
      const yMid = (p1.y + p2.y) / 2;

      const cpX1 = (xMid + p1.x) / 2;
      const cpX2 = (xMid + p2.x) / 2;

      d += ` Q ${cpX1} ${p1.y}, ${xMid} ${yMid}`;
      d += ` Q ${cpX2} ${p2.y}, ${p2.x} ${p2.y}`;
    }

    return d;
  };
  const buildAreaPath = (linePath: string, lastPoint: any, firstPoint: any) => {
    return `${linePath} L ${lastPoint.x} ${height - padding} L ${firstPoint.x} ${height - padding} Z`;
  };

  // Y-axis ticks
  const ySteps = 5;
  const yAxisValues = Array.from({ length: ySteps + 1 }, (_, i) => {
    const value = minValue + ((maxValue - minValue) / ySteps) * i;
    return Math.round(value);
  });

  return (
    <View
      style={{
        padding: 16,
        backgroundColor: colors.background,
        borderRadius: 10
      }}
    >
      <View className="flex flex-row w-full justify-between items-center mb-4">
        <View className="flex items-center flex-row  justify-center w-[80%]">
          <Text
            style={{
              color: colors.primary,
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 10,
              textAlign: "center"
            }}
          >
            {title}
          </Text>
        </View>

        <TouchableOpacity onPress={() => {
          if (showLegend) {
            hideLegend();
          } else {
            setShowLegend(true);
          }
        }} activeOpacity={0.9} className="flex float-end w-[10%] h-10 items-center justify-center size-4 ">
          <Icon
            style={{ color: colors.primary }}
            name="information-circle-outline"
            size={20} />
        </TouchableOpacity>
      </View>


      <Svg width={width} height={height}>
        {/* gradients */}
        <Defs>
          {datasetColors.map((color, index) => (
            <LinearGradient
              key={index}
              id={`gradient${index}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </LinearGradient>
          ))}
        </Defs>

        {/* Y-axis grid + labels */}
        {yAxisValues.map((value, index) => {
          const y = scaleY(value);
          return (
            <React.Fragment key={index}>
              <Line
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke={colors.border}
                strokeDasharray="4"
              />
              <SvgText
                x={padding - 6}
                y={y + 3}
                fontSize="10"
                fill={colors.text}
                textAnchor="end"
              >
                {value}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* axes */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke={colors.border}
        />

        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={colors.border}
        />

        {/* lines and points */}
        {datasets.map((dataset, dsIndex) => {
          const points = labels.map((hour, index) => {
            const dataPoint = dataset.data.find(d => d.key === hour);
            const value = Number(dataPoint?.value ?? 0);

            const x = padding + index * stepX;
            const y = isNaN(value) ? height - padding : scaleY(value);

            return { x, y, value, key: hour };
          });

          const linePath = buildSmoothPath(points);
          const areaPath = buildAreaPath(
            linePath,
            points[points.length - 1],
            points[0]
          );

          return (
            <React.Fragment key={dsIndex}>
              <Path d={areaPath} fill={`url(#gradient${dsIndex})`} />
              <Path
                d={linePath}
                fill="none"
                stroke={datasetColors[dsIndex]}
                strokeWidth={isDarkMode ? 3.5 : 3}
              />
              {points.map((p, i) => (
                <Circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={datasetColors[dsIndex]}
                  onPress={() =>
                    setTooltip({
                      x: p.x,
                      y: p.y,
                      value: p.value,
                      label: dataset.label,
                      key: p.key
                    })
                  }
                />
              ))}
            </React.Fragment>
          );
        })}

        {/* x labels */}
        {labels.map((label, index) => {
          const x = padding + index * stepX;
          return (
            <SvgText
              key={index}
              x={x}
              y={height - 10}
              fontSize="10"
              fill={colors.text}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* tooltip */}
      {tooltip && (
        <View
          style={{
            position: "absolute",
            top: tooltip.y + 10,
            left: tooltip.x - 40,
            backgroundColor: colors.card,
            padding: 6,
            borderRadius: 6
          }}
        >
          <Text style={{ color: colors.text, fontSize: 12 }}>
            {tooltip.label}
          </Text>
          <Text style={{ color: colors.text, fontSize: 12 }}>
            {tooltip.key}: {role === "admin" ? tooltip.value : ""}
          </Text>
        </View>
      )}

      {/* legend */}
      {showLegend && (
        <Animated.View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginTop: 12,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {datasets.map((ds, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 12,
                marginBottom: 6
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: datasetColors[index],
                  marginRight: 6,
                  borderRadius: 2
                }}
              />
              <Text style={{ color: colors.text, fontSize: 12 }}>{ds.label}</Text>
            </View>
          ))}
        </Animated.View>)}
    </View>
  );
};

export default MultiLineChart;