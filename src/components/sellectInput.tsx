import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    Dimensions,
    StyleSheet,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/themeContext';

type Option = {
    label: string;
    value: string | number;
};

type Props = {
    label?: string;
    options: Option[];
    value: string | number | null;
    onChange: (value: string | number) => void;
    valuExists?: string | number | null;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const SelectInput: React.FC<Props> = ({ label, options, value, onChange, valuExists }) => {
    const { colors, isDarkMode } = useTheme();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedLabel = options.find((opt) => opt.value === value)?.label || 'Select option...';

    const filtered = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    // Rendered when the field is read-only or value is locked
    if (valuExists) {
        return (
            <View style={styles.container}>
                {label && <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>}
                <View style={[styles.lockedInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                    <Text style={[styles.lockedText, { color: colors.subText }]}>{valuExists}</Text>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.subText} style={{ opacity: 0.5 }} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { zIndex: open ? 100 : 1 }]}>
            {label && <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>}

            <TouchableOpacity
                activeOpacity={0.7}
                style={[
                    styles.selector,
                    { 
                        backgroundColor: colors.card, 
                        borderColor: open ? colors.primary : colors.border 
                    }
                ]}
                onPress={() => setOpen((prev) => !prev)}
            >
                <Text style={[styles.selectedText, { color: value ? colors.text : colors.subText }]}>
                    {selectedLabel}
                </Text>
                <Ionicons 
                    name={open ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={open ? colors.primary : colors.subText} 
                />
            </TouchableOpacity>

            {open && (
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
                        <Ionicons name="search-outline" size={18} color={colors.subText} />
                        <TextInput
                            placeholder="Search..."
                            placeholderTextColor={colors.subText}
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                            style={[styles.searchInput, { color: colors.text }]}
                        />
                    </View>

                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.value.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    { backgroundColor: item.value === value ? colors.primary + '15' : 'transparent' }
                                ]}
                                onPress={() => {
                                    onChange(item.value);
                                    setOpen(false);
                                    setSearch('');
                                }}
                            >
                                <Text style={[
                                    styles.optionText, 
                                    { color: item.value === value ? colors.primary : colors.text }
                                ]}>
                                    {item.label}
                                </Text>
                                {item.value === value && (
                                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                        style={{ maxHeight: 250 }}
                        ListEmptyComponent={
                            <Text style={[styles.emptyText, { color: colors.subText }]}>No results found</Text>
                        }
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    selector: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
            android: { elevation: 2 },
        }),
    },
    selectedText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dropdown: {
        position: 'absolute',
        top: 85,
        left: 0,
        right: 0,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15 },
            android: { elevation: 10 },
        }),
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        height: 50,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '500',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
    },
    lockedInput: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    lockedText: {
        fontSize: 15,
        fontWeight: '700',
        opacity: 0.7,
    },
    emptyText: {
        padding: 20,
        textAlign: 'center',
        fontSize: 13,
    }
});

export default SelectInput;