// components/SwipeableCard.tsx
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';

interface SwipeableCardProps {
    uniqueId: string;
    children: React.ReactNode;
    onEdit: () => void;
    onPress?: () => void;
    onDelete: () => void;
    swipeRefs: any;
    currentlyOpenSwipe: any;
}

const SwipeableCard = ({ onPress, uniqueId, children, onEdit, onDelete, swipeRefs, currentlyOpenSwipe }: SwipeableCardProps) => {

    const handleSwipeOpen = () => {
        if (currentlyOpenSwipe.current && currentlyOpenSwipe.current !== swipeRefs.current[uniqueId]) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            currentlyOpenSwipe.current.close();
        }
        currentlyOpenSwipe.current = swipeRefs.current[uniqueId];
    };

    const renderRightActions = () => (
        <View style={styles.swipeContainer}>
            <TouchableOpacity style={[styles.swipeBtn, { backgroundColor: '#3b82f6' }]} onPress={onEdit}>
                <Icon name="edit" size={20} color="#fff" />
                <Text style={styles.swipeText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.swipeBtn, { backgroundColor: '#ef4444' }]} onPress={onDelete}>
                <Icon name="trash" size={20} color="#fff" />
                <Text style={styles.swipeText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Swipeable
            ref={(ref) => { swipeRefs.current[uniqueId] = ref; }}
            renderRightActions={renderRightActions}
            onSwipeableWillOpen={handleSwipeOpen}

        >
            <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
                {children}
            </TouchableOpacity>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    swipeContainer: { flexDirection: 'row', height: '90%', alignItems: 'center', marginVertical: 8 },
    swipeBtn: { justifyContent: 'center', alignItems: 'center', width: 60, height: 60, marginLeft: 8, borderRadius: 4 },
    swipeText: { color: '#fff', fontWeight: '600' },
});

export default SwipeableCard;