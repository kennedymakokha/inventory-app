import React, { useEffect, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { useSearch } from '../context/searchContext';
import { useTheme } from '../context/themeContext';

type Props = {
  placeholder?: string;
  loading?: boolean;
  white?: boolean;
};

const SearchBar: React.FC<Props> = ({ placeholder = 'Search...', loading, white }) => {
  const { query, setQuery } = useSearch();
  const inputRef = useRef<TextInput>(null);
  const { colors, isDarkMode } = useTheme();

  useEffect(() => {
    // Blur input shortly after mount to avoid auto-focus issues
    const timeout = setTimeout(() => {
      inputRef.current?.blur();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  // Determine background, text, and placeholder colors
  const backgroundColor = white
    ? colors.card
    : isDarkMode
    ? colors.card
    : colors.card;

  const textColor = white ? colors.primary : isDarkMode ? colors.text : colors.primaryDark;
  const placeholderColor = white ? colors.subText : isDarkMode ? colors.subText : colors.primaryLight;

  return (
    <>
      {loading ? (
        <View
          style={{ backgroundColor: colors.secondary, height: 40, borderRadius: 8 }}
          className="animate-pulse"
        />
      ) : (
        <View
          style={{
            backgroundColor,
            borderColor: white ? 'transparent' : colors.primary,
            borderWidth: white ? 0 : 1,
            borderRadius: 8,
            paddingHorizontal: 8,
          }}
        >
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            style={{
              color: textColor,
              height: 40,
              textAlign: 'left',
              fontSize: 16,
            }}
          />
        </View>
      )}
    </>
  );
};

export default SearchBar;