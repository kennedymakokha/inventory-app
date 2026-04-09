import { View, Text, StyleSheet, Platform } from "react-native";
import React from "react";
import SearchBar from "./searchBar";
import { useTheme } from "../context/themeContext";

interface POSHeaderProps {
  component?: () => React.ReactNode;
  title?: string;
}

const POSHeader = ({ component, title }: POSHeaderProps) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* SECTION TITLE (If no custom component is passed) */}
      {!component && title && (
        <View style={styles.titleWrapper}>
          <View style={[styles.accentLine, { backgroundColor: colors.primary }]} />
          <Text style={[styles.titleText, { color: colors.text }]}>
            {title}
          </Text>
        </View>
      )}

      {/* SEARCH OR CUSTOM COMPONENT AREA */}
      <View style={styles.contentArea}>
        {component ? (
          component()
        ) : (
          <View style={styles.searchContainer}>
            <SearchBar 
              white={false} // Let the search bar handle its own theme-based card color
              placeholder={`Search ${title || "records"}...`} 
            />
          </View>
        )}
      </View>
      
      {/* SUBTLE SEPARATOR */}
      <View style={[styles.bottomDivider, { backgroundColor: colors.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    // Ensure it sits nicely below the absolute-positioned CustomHeader
    // marginTop: Platform.OS === 'ios' ? 90 : 70, 
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accentLine: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  contentArea: {
    width: '100%',
    // marginBottom: 10,
  },
  searchContainer: {
    // Allows the SearchBar to stand out slightly from the background
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  bottomDivider: {
    height: 1,
    width: '100%',
    opacity: 0.3,
    // marginTop: 5,
  }
});

export default POSHeader;