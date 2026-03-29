import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";
import { useSelector } from "react-redux";
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

/**
 * Enhanced Donut Chart for POS Analytics
 * Uses theme-aware calibrated palette
 */
const PieChart: React.FC<PieChartProps> = ({ data = [], title }) => {
    const { colors, isDarkMode } = useTheme();
    const { user } = useSelector((state: any) => state.auth);

    const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (!data || data.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Text style={{ color: colors.subText, marginTop: 20 }}>No data available</Text>
            </View>
        );
    }

    const total = data.reduce((acc, item) => acc + item.value, 0);
    const size = 160;
    const strokeWidth = 24; // Width of the donut ring
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulativeOffset = 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
                <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            </View>

            <View style={styles.chartWrapper}>
                {/* DONUT CHART */}
                <View style={styles.svgContainer}>
                    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <G rotation="-90" origin={`${center}, ${center}`}>
                            {/* Background Ring (Track) */}
                            <Circle
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke={colors.border}
                                strokeWidth={strokeWidth}
                                fill="none"
                                opacity={0.3}
                            />
                            {/* Data Segments */}
                            {data.map((item, index) => {
                                const percentage = item.value / total;
                                const strokeDasharray = `${percentage * circumference} ${circumference}`;
                                const strokeDashoffset = -cumulativeOffset;
                                cumulativeOffset += percentage * circumference;

                                return (
                                    <Circle
                                        key={index}
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke={item.color || palette[index % palette.length]}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        fill="none"
                                        strokeLinecap="round" // Gives segments a premium rounded look
                                    />
                                );
                            })}
                        </G>
                    </Svg>
                    {/* CENTER LABEL */}
                    <View style={styles.centerLabel}>
                        <Text style={[styles.totalSub, { color: colors.subText }]}>Total</Text>
                        <Text style={[styles.totalVal, { color: colors.text }]}>
                            {user.role === 'admin' ? total.toLocaleString() : '***'}
                        </Text>
                    </View>
                </View>

                {/* LEGEND */}
                <View style={styles.legend}>
                    {data.slice(0, 5).map((item, index) => {
                        const percent = Math.round((item.value / total) * 100);
                        const sliceColor = item.color || palette[index % palette.length];
                        return (
                            <View key={index} style={styles.legendItem}>
                                <View style={[styles.swatch, { backgroundColor: sliceColor }]} />
                                <View>
                                    <Text numberOfLines={1} style={[styles.legendKey, { color: colors.text }]}>
                                        {item.key}
                                    </Text>
                                    <Text style={[styles.legendPercent, { color: colors.subText }]}>
                                        {percent}%
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    indicator: {
        width: 4,
        height: 16,
        borderRadius: 2,
        marginRight: 8,
    },
    title: {
        fontSize: 13,
        fontWeight: "900",
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chartWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    svgContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerLabel: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    totalSub: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    totalVal: {
        fontSize: 16,
        fontWeight: '900',
    },
    legend: {
        flex: 1,
        marginLeft: 20,
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    swatch: {
        width: 10,
        height: 10,
        borderRadius: 3,
        marginRight: 10,
    },
    legendKey: {
        fontSize: 11,
        fontWeight: '800',
        width: 80,
    },
    legendPercent: {
        fontSize: 10,
        fontWeight: '600',
    }
});

export default PieChart;