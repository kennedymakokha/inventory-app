import React, { useEffect, useRef, useState } from 'react';
import { TextInput, View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useSearch } from '../context/searchContext';
import { useTheme } from '../context/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = {
    placeholder?: string;
    loading?: boolean;
    white?: boolean; // Used if search is on a colored background
};

const SearchBar: React.FC<Props> = ({ placeholder = 'Search...', loading, white }) => {
    const { query, setQuery } = useSearch();
    const inputRef = useRef<TextInput>(null);
    const { colors, isDarkMode } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    // Visual styles based on theme and context
    const bgStyle = white 
        ? { backgroundColor: 'rgba(255,255,255,0.2)' } 
        : { backgroundColor: colors.card, borderColor: isFocused ? colors.primary : colors.border };

    const textColor = white ? '#FFFFFF' : colors.text;
    const iconColor = white ? 'rgba(255,255,255,0.6)' : isFocused ? colors.primary : colors.subText;

    return (
        <View style={[
            styles.wrapper, 
            bgStyle, 
            !white && styles.withBorder,
            isFocused && !white && styles.focusedShadow
        ]}>
            <View style={styles.iconSection}>
                {loading ? (
                    <ActivityIndicator size="small" color={iconColor} />
                ) : (
                    <Ionicons name="search-outline" size={18} color={iconColor} />
                )}
            </View>

            <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                placeholderTextColor={white ? 'rgba(255,255,255,0.5)' : colors.subText}
                selectionColor={colors.primary}
                style={[styles.input, { color: textColor }]}
            />

            {query.length > 0 && (
                <TouchableOpacity 
                    onPress={() => {
                        setQuery("");
                        inputRef.current?.focus();
                    }}
                    style={styles.clearBtn}
                >
                    <Ionicons name="close-circle" size={18} color={iconColor} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        transition: 'all 0.2s ease', // Conceptually for logic
    },
    withBorder: {
        borderWidth: 1.5,
    },
    focusedShadow: {
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 3 }
        })
    },
    iconSection: {
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        height: '100%',
        paddingVertical: 0, // Prevents Android vertical shifting
    },
    clearBtn: {
        padding: 4,
        marginLeft: 4,
    }
});

export default SearchBar;