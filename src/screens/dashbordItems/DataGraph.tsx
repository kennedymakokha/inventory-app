import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Theme } from '../../utils/theme';

const DataGraph = ({ data = [], title }: any) => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;

    if (!data || data.length === 0) {
        // --- Empty state ---
        return (
            <View style={[styles.container, { backgroundColor: theme.background, padding: 20 }]}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>
                    No data available
                </Text>
            </View>
        );
    }

    const maxValue = Math.max(...data.map((item: any) => item.value));

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

            <View style={styles.chartRow}>
                {/* Y Axis */}
                <View style={styles.yAxis}>
                    {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map(
                        (value, i) => (
                            <Text key={i} style={[styles.yAxisText, { color: theme.text }]}>
                                {Math.round(value)}
                            </Text>
                        )
                    )}
                </View>

                {/* Chart Area */}
                <View style={styles.chartWrapper}>
                    {/* Bars */}
                    <View style={styles.chartContainer}>
                        {data.map((item: any, index: any) => {
                            const barHeight = (item.value / maxValue) * 200;
                            return (
                                <View key={index} style={styles.barWrapper}>
                                    <Text style={[styles.valueText, { color: theme.text }]}>
                                        {item.value}
                                    </Text>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: barHeight,
                                                backgroundColor: Theme.primary,
                                            },
                                        ]}
                                    />
                                </View>
                            );
                        })}
                    </View>

                    {/* X Axis */}
                    <View style={styles.xAxis} />

                    {/* Labels */}
                    <View style={styles.labelRow}>
                        {data.map((item: any, index: any) => (
                            <Text key={index} style={[styles.label, { color: theme.text }]}>
                                {item.key}
                            </Text>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    chartRow: {
        flexDirection: 'row',
    },
    yAxis: {
        justifyContent: 'space-between',
        height: 200,
        marginRight: 8,
    },
    yAxisText: {
        fontSize: 11,
    },
    chartWrapper: {
        flex: 1,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 200,
        borderLeftWidth: 1,
        borderColor: '#ccc',
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    bar: {
        width: 28,
        borderTopRightRadius: 6,
        borderTopLeftRadius: 6,
    },
    valueText: {
        fontSize: 11,
        marginBottom: 4,
    },
    xAxis: {
        height: 1,
        backgroundColor: '#ccc',
    },
    labelRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    label: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        transform: [{ rotate: '-40deg' }],
    },
});

export default DataGraph;