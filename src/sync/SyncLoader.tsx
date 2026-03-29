import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions, Platform } from "react-native";
import { globalSync } from ".";
import { syncTables } from "./tables";
import { useTheme } from "../context/themeContext";
import Ionicons from 'react-native-vector-icons/Ionicons';

const { height, width } = Dimensions.get("window");

export const SyncLoader = ({ onDone }: any) => {
    const { colors, isDarkMode } = useTheme();
    const [status, setStatus] = useState("Syncing data...");
    const [failed, setFailed] = useState(false);
    const [percent, setPercent] = useState(0);

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startSync = async () => {
            const success = await globalSync(syncTables, (progress: number) => {
                setPercent(Math.round(progress)); // Update numerical text
                Animated.timing(progressAnim, {
                    toValue: progress / 100,
                    duration: 400,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                }).start();
            });

            if (success) {
                setStatus("Sync Successful");
            } else {
                setStatus("Sync Failed");
                setFailed(true);
            }

            setTimeout(() => {
                onDone();
            }, 1800);
        };

        startSync();
    }, []);

    // Fill height from bottom to top
    const heightInterpolate = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height],
    });

    // Background color transition from soft primary to solid primary
    const colorInterpolate = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.primary + '20', colors.primary],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            
            {/* 1. DYNAMIC BACKGROUND FILL */}
            <Animated.View
                style={[
                    styles.fill,
                    {
                        height: heightInterpolate,
                        backgroundColor: failed ? "#ef4444" : colorInterpolate,
                    },
                ]}
            />

            {/* 2. CENTER CONTENT CARD */}
            <View style={[styles.glassCard, { 
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: colors.border
            }]}>
                <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
                    {failed ? (
                        <Ionicons name="cloud-offline-outline" size={32} color="#ef4444" />
                    ) : percent === 100 ? (
                        <Ionicons name="checkmark-done-circle" size={36} color={colors.primary} />
                    ) : (
                        <Ionicons name="cloud-download-outline" size={32} color={colors.primary} />
                    )}
                </View>

                <Text style={[styles.status, { color: colors.text }]}>{status}</Text>
                
                <View style={styles.percentContainer}>
                    <Text style={[styles.percentText, { color: colors.primary }]}>{percent}</Text>
                    <Text style={[styles.percentSymbol, { color: colors.subText }]}>%</Text>
                </View>

                <View style={[styles.miniBarContainer, { backgroundColor: colors.border }]}>
                    <Animated.View 
                        style={[styles.miniBar, { 
                            backgroundColor: colors.primary, 
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            }) 
                        }]} 
                    />
                </View>
            </View>

            {/* 3. FOOTER */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.subText }]}>
                    Powered by <Text style={{ color: colors.primary, fontWeight: '900' }}>MTANDAO.APP</Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    fill: {
        position: "absolute",
        bottom: 0,
        width: "100%",
    },
    glassCard: {
        width: width * 0.8,
        padding: 30,
        borderRadius: 30,
        borderWidth: 1,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 10 }
        })
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    status: {
        fontSize: 14,
        fontWeight: "900",
        textTransform: 'uppercase',
        letterSpacing: 2,
        textAlign: 'center'
    },
    percentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 10,
    },
    percentText: {
        fontSize: 48,
        fontWeight: "900",
        lineHeight: 48,
    },
    percentSymbol: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
        marginLeft: 2,
    },
    miniBarContainer: {
        height: 4,
        width: '100%',
        borderRadius: 2,
        marginTop: 15,
        overflow: 'hidden'
    },
    miniBar: {
        height: '100%',
    },
    footer: {
        position: "absolute",
        bottom: 40,
        width: "100%",
        alignItems: "center",
    },
    footerText: {
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase'
    },
});