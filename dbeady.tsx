import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from './src/context/themeContext';


const DatabaseLoader = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content"  backgroundColor="transparent" />
            
            {/* Background Decorative Element */}
            <View style={[styles.circleBg, { backgroundColor: colors.primary, opacity: 0.1 }]} />

            <View style={styles.center}>
                <View style={styles.indicatorWrapper}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    {/* Optional: Add a subtle pulse ring around the indicator */}
                    <View style={[styles.pulseRing, { borderColor: colors.primary }]} />
                </View>

                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Initializing Database
                </Text>
                
                <View style={styles.statusLine}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.subText, { color: colors.subText }]}>
                        Setting up your workspace...
                    </Text>
                </View>
            </View>

            {/* Footer Brand */}
            <View style={styles.footer}>
                <Text style={[styles.brandText, { color: colors.subText }]}>
                    Powered by <Text style={{ color: colors.primary, fontWeight: '900' }}>MTANDAO</Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleBg: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        top: -100,
        right: -100,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicatorWrapper: {
        marginBottom: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        opacity: 0.3,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    statusLine: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    subText: {
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    brandText: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});

export default DatabaseLoader;