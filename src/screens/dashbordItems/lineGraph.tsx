import React, { useMemo, useState } from "react";
import { View, Text, Dimensions } from "react-native";
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

const MultiLineChart: React.FC<LineGraphProps> = ({ datasets = [], title }) => {
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;

  const {
    user: { role }
  } = useSelector((state: any) => state.auth);

  const [tooltip, setTooltip] = useState<any>(null);

  const width = screenWidth - 10;
  const height = 220;
  const padding = 20;

  // Always call hooks here
  const datasetColors = useMemo(() => {
    return datasets.map(ds => ds.color ?? getThemeAwareColor(isDarkMode));
  }, [datasets, isDarkMode]);

  // Now conditionally render chart or "No data"
  if (!datasets.length) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: theme.text }}>{title}</Text>
        <Text style={{ color: theme.text }}>No data available</Text>
      </View>
    );
  }



  const allValues = datasets.flatMap(ds => ds.data.map(d => d.value));

  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);

  const labels = datasets[0].data.map(d => d.key);

  const stepX = (width - padding * 2) / (labels.length - 1);

  const scaleY = (value: number) =>
    height -
    padding -
    ((value - minValue) / (maxValue - minValue || 1)) *
    (height - padding * 2);

  const buildSmoothPath = (points: any[]) => {
    if (!points.length) return "";
    if (points.some(p => isNaN(p.x) || isNaN(p.y))) return ""; // skip invalid points

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      const yMid = (points[i].y + points[i + 1].y) / 2;
      const cpX1 = (xMid + points[i].x) / 2;
      const cpX2 = (xMid + points[i + 1].x) / 2;
      d += ` Q ${cpX1} ${points[i].y}, ${xMid} ${yMid}`;
      d += ` Q ${cpX2} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return d;
  };

  const buildAreaPath = (linePath: string, lastPoint: any, firstPoint: any) => {
    return `${linePath} L ${lastPoint.x} ${height - padding} L ${firstPoint.x} ${height - padding} Z`;
  };

  return (
    <View
      style={{
        padding: 16,
        backgroundColor: theme.background,
        borderRadius: 10
      }}
    >

      <Text
        style={{
          color: theme.text,
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 10,
          textAlign: "center"
        }}
      >
        {title}
      </Text>

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

        {/* grid */}
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <Line
            key={i}
            x1={padding}
            x2={width - padding}
            y1={padding + (height - padding * 2) * g}
            y2={padding + (height - padding * 2) * g}
            stroke={theme.border}
            strokeDasharray="4"
          />
        ))}

        {/* axes */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke={theme.border}
        />

        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={theme.border}
        />

        {datasets.map((dataset, dsIndex) => {

          const points = dataset.data.map((item, index) => {

            const x = padding + index * stepX;
            const y = scaleY(item.value);

            return { x, y, value: item.value, key: item.key };

          });

          const linePath = buildSmoothPath(points);
          const areaPath = buildAreaPath(
            linePath,
            points[points.length - 1],
            points[0]
          );

          return (
            <React.Fragment key={dsIndex}>

              {/* gradient area */}
              <Path
                d={areaPath}
                fill={`url(#gradient${dsIndex})`}
              />

              {/* line */}
              <Path
                d={linePath}
                fill="none"
                stroke={datasetColors[dsIndex]}
                strokeWidth={isDarkMode ? 3.5 : 3}
              />

              {/* points */}
              {points.map((p, i) => (
                <Circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={datasetColors[dsIndex]}
                  onPress={() => {
                    setTooltip({
                      x: p.x,
                      y: p.y,
                      value: p.value,
                      label: dataset.label,
                      key: p.key
                    });
                  }}
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
              fill={theme.text}
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
            backgroundColor: theme.card,
            padding: 6,
            borderRadius: 6
          }}
        >
          <Text style={{ color: theme.text, fontSize: 12 }}>
            {tooltip.label}
          </Text>

          <Text style={{ color: theme.text, fontSize: 12 }}>
            {tooltip.key}: {role === "admin" ? tooltip.value : ""}
          </Text>
        </View>
      )}

      {/* legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>

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

            <Text style={{ color: theme.text, fontSize: 12 }}>
              {ds.label}
            </Text>
          </View>
        ))}

      </View>

    </View>
  );
};

export default MultiLineChart;