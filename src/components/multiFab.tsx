import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface ActionButton {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  color?: string;
}

interface RadialFabProps {
  actions: ActionButton[];
  mainColor?: string;
  mainIcon?: keyof typeof Ionicons.glyphMap;
  position?: { bottom: number; right: number };
  radius?: number;
  angle?: number;
}

const RadialFab = ({
  actions,
  mainColor = '#16a34a', // POS green
  mainIcon = 'menu',
  position = { bottom: 25, right: 25 },
  radius = 100,
  angle = 90,
}: RadialFabProps) => {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleFab = () => {
    Animated.timing(animation, {
      toValue: open ? 0 : 1,
      duration: 260,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    setOpen(!open);
  };

  return (
    <View style={[styles.container, { bottom: position.bottom, right: position.right }]}>

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
          outputRange: [0.6, 0.85], // smaller than main FAB
        });

        const opacity = animation.interpolate({
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
                opacity,
                backgroundColor: action.color || '#22c55e',
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                action.onPress();
                toggleFab(); // auto close after press
              }}
              activeOpacity={0.8}
              style={styles.actionButton}
            >
              <Ionicons name={action.icon} size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.mainFab, { backgroundColor: mainColor }]}
        onPress={toggleFab}
        activeOpacity={0.85}
      >
        <Ionicons name={open ? 'close' : mainIcon} size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },

  mainFab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },

  smallFab: {
    width: 48, // smaller
    height: 48,
    borderRadius: 24,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },

  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RadialFab;