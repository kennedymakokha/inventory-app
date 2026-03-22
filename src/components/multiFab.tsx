import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { View, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Assuming you might want to pass colors in or use a default
const DEFAULT_COLOR = '#000fff';

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
  mainIcon?: any; // Use specific icon type if preferred
  position?: { bottom: number; right: number };
  radius?: number;
  angle?: number;
}

const RadialFab = ({
  actions = [],
  mainAction,
  mainColor = DEFAULT_COLOR,
  mainIcon = 'menu',
  position = { bottom: 25, right: 25 },
  radius = 90,
  angle = 90,
}: RadialFabProps) => {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleFab = () => {
    if (actions.length === 0) {
      mainAction?.();
      return;
    }

    Animated.timing(animation, {
      toValue: open ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.back(1.5)), // Added a slight "bounce" effect
      useNativeDriver: true,
    }).start();

    setOpen(!open);
  };

  return (
    // Fixed: Added zIndex and ensured container doesn't block touches when closed
    <View
      style={[
        styles.container,
        { bottom: position.bottom, right: position.right }
      ]}
      pointerEvents="box-none"
    >
      {actions.map((action, index) => {
        // Calculate angle: if 3 items and 90 deg, they go 0, 45, 90
        const step = actions.length > 1 ? angle / (actions.length - 1) : 0;
        // Start from 0 (Left) to 90 (Up)
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
                opacity: animation, // Direct mapping to animation value
                backgroundColor: action.color || mainColor,
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
              {action.icon !== "" ? <Ionicons name={action.icon} size={20} color="#fff" /> : <Text>{action.label}</Text>}
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <TouchableOpacity
        style={[styles.mainFab, { backgroundColor: mainColor }]}
        onPress={toggleFab}
        activeOpacity={0.85}
      >
        {/* Added Rotation to the icon itself */}
        <Animated.View style={{
          transform: [{
            rotate: animation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '90deg']
            })
          }]
        }}>
          <Ionicons name={open ? 'close' : mainIcon} size={26} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // Important: center these so translate works from middle
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  smallFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'absolute', // Stacked behind main FAB until animated
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  touchTarget: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default RadialFab;