import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/themeContext';

type SortDirection = 'asc' | 'desc' | null;

type Props = {
    headers: { key: string; label: string }[];
    data: Record<string, any>[];
};

const SortableTable = ({ headers, data }: Props) => {
    const { colors, isDarkMode } = useTheme();
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
        key: '',
        direction: null,
    });

    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return data;
        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            return sortConfig.direction === 'asc'
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });
    }, [data, sortConfig]);

    const toggleSort = (key: string) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                const nextDir = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc';
                return { key, direction: nextDir };
            }
            return { key, direction: 'asc' };
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    {/* --- HEADER ROW --- */}
                    <View style={[styles.headerRow, { borderBottomColor: colors.border, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}>
                        {headers.map(({ key, label }) => {
                            const isSorted = sortConfig.key === key;
                            return (
                                <Pressable
                                    key={key}
                                    onPress={() => toggleSort(key)}
                                    style={styles.headerCell}
                                >
                                    <Text style={[styles.headerLabel, { color: isSorted ? colors.primary : colors.subText }]}>
                                        {label}
                                    </Text>
                                    <View style={styles.iconContainer}>
                                        {isSorted ? (
                                            <Ionicons 
                                                name={sortConfig.direction === 'asc' ? "arrow-up" : "arrow-down"} 
                                                size={12} 
                                                color={colors.primary} 
                                            />
                                        ) : (
                                            <Ionicons name="swap-vertical-outline" size={12} color={colors.border} />
                                        )}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* --- DATA ROWS --- */}
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {sortedData.map((row, rowIndex) => (
                            <View
                                key={rowIndex}
                                style={[
                                    styles.dataRow,
                                    { 
                                        borderBottomColor: colors.border,
                                        backgroundColor: rowIndex % 2 === 0 ? 'transparent' : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')
                                    }
                                ]}
                            >
                                {headers.map(({ key }) => (
                                    <View key={key} style={styles.dataCell}>
                                        <Text style={[styles.cellText, { color: colors.text }]}>
                                            {row[key] ?? '-'}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                        {sortedData.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: colors.subText, fontSize: 12 }}>No data available</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginVertical: 10,
    },
    headerRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    headerCell: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        minWidth: 120,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLabel: {
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    iconContainer: {
        marginLeft: 4,
        width: 14,
    },
    dataRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
    },
    dataCell: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        minWidth: 120,
        justifyContent: 'center',
    },
    cellText: {
        fontSize: 13,
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    }
});

export default SortableTable;