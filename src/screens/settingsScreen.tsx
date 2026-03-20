import React from 'react';
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import PageHeader from '../components/pageHeader';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/themeContext';


const SettingsScreen = () => {
    const { isScanToCartEnabled, setScanToCart } = useSettings();

    // const colors = theme[isDarkMode ? 'dark' : 'light'];// <-- get dynamic colors from context
    const { colors, isDarkMode, setDarkMode } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <PageHeader
                component={() => (
                    <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 20, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                        System Settings
                    </Text>
                )}
            />

            <ScrollView style={{ padding: 16 }}>
                <Text style={{ marginBottom: 16, fontWeight: 'bold', textTransform: 'uppercase', color: colors.subText }}>
                    Inventory & Sales
                </Text>

                {/* Scan to Cart Toggle */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Icon name="barcode" size={18} color={colors.success} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>Scan to Cart</Text>
                        </View>
                        <Text style={{ color: colors.subText }}>
                            If enabled, scanning a barcode adds the item directly to the cart with quantity 1.
                        </Text>
                    </View>
                    <Switch
                        value={isScanToCartEnabled}
                        onValueChange={setScanToCart}
                        trackColor={{ false: '#767577', true: colors.success }}
                        thumbColor="#f4f3f4"
                    />
                </View>

                <Text style={{ marginTop: 24, marginBottom: 16, fontWeight: 'bold', textTransform: 'uppercase', color: colors.subText }}>
                    Appearance
                </Text>

                {/* Dark Mode Toggle */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Icon name="moon" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>Dark Mode</Text>
                        </View>
                        <Text style={{ color: colors.subText }}>
                            Adjust the interface for low-light environments.
                        </Text>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={(value) => setDarkMode(value)}
                        trackColor={{ false: '#767577', true: colors.primary }}
                        thumbColor="#f4f3f4"
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
    },
});

export default SettingsScreen;