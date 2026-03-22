import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useSettings } from "../../context/SettingsContext";
import { Theme } from "../../utils/theme";
import { useSelector } from "react-redux";
import { getThemeAwareColor } from "./lineGraph";
import { useTheme } from "../../context/themeContext";

interface PieData {
    key: string;
    value: number;
    color?: string;
}

interface PieChartProps {
    data: PieData[];
    title: string;
}

// Generate random color
const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

const PieChart: React.FC<PieChartProps> = ({ data = [], title }) => {
    const { colors, isDarkMode } = useTheme();
    const { user: { role } } = useSelector((state: any) => state.auth);

    // --- Empty state ---
    if (!data || data.length === 0) {
        return (
            <View style={{
                borderColor: colors.border,
                padding: 16,
                alignItems: "center",
                backgroundColor: colors.background
            }}>
                <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16, color: colors.text }}>
                    {title}
                </Text>
                <Text style={{ color: colors.text, fontSize: 16 }}>
                    No data available
                </Text>
            </View>
        );
    }

    const total = data.reduce((acc, item) => acc + item.value, 0);
    const size = 150;
    const radius = size / 2;
    const center = radius;

    const sliceColors = data.map((item) => item.color ?? getThemeAwareColor(isDarkMode));
    let cumulativeAngle = 0;

    const createSlice = (value: number) => {
        const angle = (value / total) * 2 * Math.PI;
        const x1 = center + radius * Math.cos(cumulativeAngle);
        const y1 = center + radius * Math.sin(cumulativeAngle);
        cumulativeAngle += angle;
        const x2 = center + radius * Math.cos(cumulativeAngle);
        const y2 = center + radius * Math.sin(cumulativeAngle);
        const largeArcFlag = angle > Math.PI ? 1 : 0;

        return `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    };

    return (
        <View style={{ borderColor: colors.border, padding: 16, alignItems: "center", backgroundColor: colors.background }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16, color: colors.primary }}>
                {title}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Pie chart */}
                <Svg width={size} height={size}>
                    {data.length === 1 ? (
                        <Circle cx={center} cy={center} r={radius} fill={sliceColors[0]} />
                    ) : (
                        data.map((item, index) => (
                            <Path key={index} d={createSlice(item.value)} fill={sliceColors[index]} />
                        ))
                    )}
                </Svg>

                {/* Legend */}
                <View style={{ marginLeft: 16, justifyContent: "center" }}>
                    {data.map((item, index) => {
                        const slicePercent = (item.value / total) * 100;
                        return (
                            <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                <View
                                    style={{
                                        width: 14,
                                        height: 14,
                                        backgroundColor: sliceColors[index],
                                        marginRight: 8,
                                        borderRadius: 3,
                                    }}
                                />
                                <Text style={{ fontSize: 12, color: colors.text }}>
                                    {item.key}: {role === "admin" ? item.value : ""} ({Math.round(slicePercent)}%)
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

export default PieChart;