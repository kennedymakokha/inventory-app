import React, { useRef, useState } from 'react';
import { Text, View, TouchableOpacity, Animated, Easing, StyleSheet, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/themeContext';

export interface ActionButton {
    icon: keyof typeof Ionicons.glyphMap;
    label?: string;
    onPress: () => void;
    color?: string;
}

interface RadialFabProps {
    actions?: ActionButton[];
    mainAction?: () => void;
    mainColor?: string;
    mainIcon?: any;
    radius?: number;
    angle?: number;
}

const RadialFab = ({
    actions = [],
    mainAction,
    mainColor,
    mainIcon = 'add-outline', // Modern outline icon
    radius = 100,
    angle = 90,
}: RadialFabProps) => {
    const { colors } = useTheme();
    const [open, setOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    // Use theme primary if no mainColor is provided
    const activeColor = mainColor || colors.primary;

    const toggleFab = () => {
        if (actions.length === 0) {
            mainAction?.();
            return;
        }

        Animated.timing(animation, {
            toValue: open ? 0 : 1,
            duration: 350,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
        }).start();

        setOpen(!open);
    };

    return (
        <View
            style={styles.container}
            pointerEvents="box-none"
        >
            {actions.map((action, index) => {
                const step = actions.length > 1 ? angle / (actions.length - 1) : 0;
                const theta = (step * index * Math.PI) / 180;

                const translateX = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -radius * Math.cos(theta)],
                });

                const translateY = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -radius * Math.sin(theta)],
                });

                const scale = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.smallFab,
                            {
                                transform: [{ translateX }, { translateY }, { scale }],
                                opacity: animation,
                                backgroundColor: action.color || activeColor,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                action.onPress();
                                toggleFab();
                            }}
                            style={styles.touchTarget}
                        >
                            {action.icon !== "" ? (
                                <Ionicons name={action.icon} size={20} color="#fff" />
                            ) : (
                                <Text style={styles.labelText}>{action.label}</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            <TouchableOpacity
                style={[styles.mainFab, { backgroundColor: activeColor }]}
                onPress={toggleFab}
                activeOpacity={0.9}
            >
                <Animated.View style={{
                    transform: [{
                        rotate: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '135deg'] // Slight over-rotate for "X" effect
                        })
                    }]
                }}>
                    <Ionicons name={mainIcon} size={28} color="#fff" />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        // --- POSITIONING ---
        // 70px (TabBar) + 25px (Gap) = 95px from bottom
        bottom: Platform.OS === 'ios' ? 110 : 95, 
        right: 25,
        // Ensure it sits above the Tab Navigator (elevation 25)
        zIndex: 9999,
        elevation: 30, 
    },
    mainFab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
    },
    smallFab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
        elevation: 8,
    },
    touchTarget: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold'
    }
});

export default RadialFab;