import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { useTheme } from '../../../context/themeContext';

const Keypad = ({ value, onChange }: any) => {
  const { colors } = useTheme();

  const handlePress = (key: string) => {
    if (key === "C") {
      onChange("");
      return;
    }

    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }

    // prevent multiple decimals
    if (key === "." && value.includes(".")) return;

    const newValue = value + key;
    onChange(newValue);
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", ".", "⌫"],
  ];

  return (
    <View style={{ marginTop: 24 }}>
      {keys.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => handlePress(key)}
              style={{
                backgroundColor: colors.card,
                width: "30%",
                paddingVertical: 20,
                borderRadius: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.primaryLight,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity
        onPress={() => handlePress("C")}
        style={{
          backgroundColor: colors.danger,
          paddingVertical: 18,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            letterSpacing: 1,
          }}
        >
          CLEAR
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Keypad;