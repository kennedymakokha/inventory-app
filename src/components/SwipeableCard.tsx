// components/SwipeableCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
interface SwipeableCardProps {
    children: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
}

const SwipeableCard = ({ children, onEdit, onDelete }: SwipeableCardProps) => {
    const renderRightActions = () => (
        <View style={styles.swipeContainer}>
            <TouchableOpacity style={[styles.swipeBtn, { backgroundColor: '#3b82f6' }]} onPress={onEdit}>
                <Icon name="edit" size={20} color="#fff" style={styles.swipeText} />
                <Text style={styles.swipeText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.swipeBtn, { backgroundColor: '#ef4444' }]} onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onDelete();
            }}>
                <Icon name="trash" size={20} color="#fff" />
                <Text style={styles.swipeText}>Delete</Text>
            </TouchableOpacity>
        </View>

    );

    return <Swipeable renderRightActions={renderRightActions}>{children}</Swipeable>;
};

const styles = StyleSheet.create({
    swipeContainer: {
        flexDirection: 'row',
        height: '90%',
        alignItems: 'center',
        marginVertical: 8

    },
    swipeBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        marginBottom:13,
        marginLeft: 8,
        borderRadius: 4,
    },
    swipeText: { color: '#fff', fontWeight: '600' }
});

export default SwipeableCard;