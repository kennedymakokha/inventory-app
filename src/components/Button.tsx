// components/Button.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import { useTheme } from '../context/themeContext';


interface ButtonProps {
  handleclick: () => void;
  title: string;
  disabled?: boolean;
  outline?: boolean;
  loading?: boolean;
}

interface FabProps {
  handleclick: () => void;
  icon: string;
  title?: string;
  outline?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ handleclick, disabled, outline, title, loading }) => {
  const { colors } = useTheme();

  const backgroundColor = outline ? 'transparent' : colors.primary;
  const borderColor = outline ? colors.primaryLight : 'transparent';
  const textColor = outline ? colors.primary : colors.primaryLight;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={loading || disabled ? () => {} : handleclick}
      style={[
        styles.button,
        { backgroundColor, borderColor },
        outline && { borderWidth: 1 },
        disabled && { opacity: 0.5 }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export const Fab: React.FC<FabProps> = ({ handleclick, outline, icon, loading }) => {
  const { colors } = useTheme();

  const backgroundColor = outline ? 'transparent' : colors.primary;
  const borderColor = outline ? colors.primaryLight : 'transparent';
  const iconColor = outline ? colors.primaryLight : colors.primaryLight;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={loading ? () => {} : handleclick}
      style={[
        styles.fab,
        { backgroundColor, borderColor },
        outline && { borderWidth: 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <Icon name={icon} size={28} color={iconColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default Button;