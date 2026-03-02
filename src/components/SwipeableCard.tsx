// components/SwipeableCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface SwipeableCardProps {
    children: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
}

const SwipeableCard = ({ children, onEdit, onDelete }: SwipeableCardProps) => {
    const renderRightActions = () => (
        <View style={styles.swipeContainer}>
            <TouchableOpacity style={[styles.swipeBtn, { backgroundColor: '#3b82f6' }]} onPress={onEdit}>
                <Text style={styles.swipeText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.swipeBtn, { backgroundColor: '#ef4444' }]} onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onDelete();
            }}>
                <Text style={styles.swipeText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return <Swipeable renderRightActions={renderRightActions}>{children}</Swipeable>;
};

const styles = StyleSheet.create({
    swipeContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    swipeBtn: { justifyContent: 'center', alignItems: 'center', width: 80, marginLeft: 8, borderRadius: 12 },
    swipeText: { color: '#fff', fontWeight: '600' }
});

export default SwipeableCard;