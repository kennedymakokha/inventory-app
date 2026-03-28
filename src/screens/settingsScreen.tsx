import React from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import PageHeader from '../components/pageHeader';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/themeContext';

const SettingsScreen = () => {
    const { isScanToCartEnabled, setScanToCart } = useSettings();
    const { colors, isDarkMode, setDarkMode } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <PageHeader
                component={() => (
                    <Text style={[styles.headerText, { color: colors.text }]}>
                        System Configuration
                    </Text>
                )}
            />

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* SECTION: INVENTORY */}
                <Text style={[styles.sectionTitle, { color: colors.subText }]}>
                    Inventory & Sales
                </Text>
                
                <View style={[styles.sectionGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.iconWrapper}>
                            <Icon name="barcode" size={16} color={colors.success} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Scan to Cart</Text>
                            <Text style={[styles.settingDescription, { color: colors.subText }]}>
                                Automatically add items with qty 1 upon scanning.
                            </Text>
                        </View>
                        <Switch
                            value={isScanToCartEnabled}
                            onValueChange={setScanToCart}
                            trackColor={{ false: '#CBD5E1', true: colors.success }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* SECTION: APPEARANCE */}
                <Text style={[styles.sectionTitle, { color: colors.subText }]}>
                    Interface
                </Text>

                <View style={[styles.sectionGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.settingRow}>
                        <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <Icon name="moon" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                            <Text style={[styles.settingDescription, { color: colors.subText }]}>
                                Optimized for low-light terminal usage.
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={(value) => setDarkMode(value)}
                            trackColor={{ false: '#CBD5E1', true: colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                    
                    {/* Divider for grouped items */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={styles.settingRow}>
                        <View style={[styles.iconWrapper, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                            <Icon name="language" size={16} color={colors.subText} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Terminal Language</Text>
                            <Text style={[styles.settingDescription, { color: colors.subText }]}>English (US)</Text>
                        </View>
                        <Icon name="chevron-right" size={12} color={colors.subText} />
                    </TouchableOpacity>
                </View>

                {/* VERSION INFO */}
                <View style={styles.footer}>
                    <Text style={[styles.versionText, { color: colors.subText }]}>
                        Terminal Build: v2.4.12-Stable
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    headerText: {
        fontWeight: '800',
        fontSize: 18,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 4,
    },
    sectionGroup: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        overflow: 'hidden', // Ensures divider doesn't bleed
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        paddingRight: 8,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    footer: {
        marginTop: 10,
        alignItems: 'center',
        paddingBottom: 40,
    },
    versionText: {
        fontSize: 11,
        fontWeight: '500',
        opacity: 0.6,
    },
});

export default SettingsScreen;