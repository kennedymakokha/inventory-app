import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/EvilIcons'
// chevron-down
type SortDirection = 'asc' | 'desc' | null;

type Props = {
    headers: { key: string; label: string }[];
    data: Record<string, any>[];
};

const SortableTable = ({ headers, data }: Props) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
        key: '',
        direction: null,
    });

    const sortedData = React.useMemo(() => {
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
            } else {
                return { key, direction: 'asc' };
            }
        });
    };

    return (
        <ScrollView horizontal className="w-full">
            <View>
                {/* Header */}
                <View className="flex-row bg-gray-200 border border-gray-300">
                    {headers.map(({ key, label }) => (
                        <Pressable
                            key={key}
                            onPress={() => toggleSort(key)}
                            className="p-3 border-r border-gray-300 min-w-[120px] max-w-[160px] flex-row items-center gap-1"
                        >
                            <Text className="font-bold" numberOfLines={1}>{label}</Text>
                            {sortConfig.key === key && (
                                sortConfig.direction === 'asc' ? (
                                    <Icon name="chevron-up" size={16} />
                                ) : sortConfig.direction === 'desc' ? (
                                    <Icon name="chevron-down" size={16} />
                                ) : null
                            )}
                        </Pressable>
                    ))}
                </View>

                {/* Data Rows */}
                {sortedData.map((row, rowIndex) => (
                    <View
                        key={rowIndex}
                        className={`flex-row bg-gray-50`}
                    >
                        {headers.map(({ key }) => (
                            <View key={key} className="p-3 border border-gray-300 min-w-[120px]">
                                <Text className='text-white'>{row[key]}</Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

export default SortableTable;
