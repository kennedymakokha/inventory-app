import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTheme } from '../../../context/themeContext';

const Keypad = ({ value, onChange, activeField }: any) => {
  const { colors } = useTheme();
  const [isABC, setIsABC] = useState(false); // Toggle state

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

    // KRA PINs are usually uppercase
    const newValue = value + key.toUpperCase();
    onChange(newValue);
  };

  const numberKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["0", ".", "⌫"],
  ];

  const letterKeys = [
    ["A", "B", "C", "D", "E"],
    ["F", "G", "H", "I", "J"],
    ["K", "L", "M", "N", "O"],
    ["P", "Q", "R", "S", "T"],
    ["U", "V", "W", "X", "Y"],
    ["Z", "⌫", "C"],
  ];
  console.log(activeField)
  return (
    <View style={{ marginTop: 24 }}>
      {/* MODE TOGGLE TAB */}
     {activeField === "customerPin" && <View style={{ flexDirection: 'row', marginBottom: 15, backgroundColor: colors.card, borderRadius: 10, padding: 4 }}>
        <TouchableOpacity
          onPress={() => setIsABC(false)}
          style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: !isABC ? colors.primary : 'transparent', borderRadius: 8 }}
        >
          <Text style={{ color: !isABC ? '#fff' : colors.text, fontWeight: 'bold' }}>123</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsABC(true)}
          style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: isABC ? colors.primary : 'transparent', borderRadius: 8 }}
        >
          <Text style={{ color: isABC ? '#fff' : colors.text, fontWeight: 'bold' }}>ABC</Text>
        </TouchableOpacity>
      </View>}

      {/* KEYPAD GRID */}
      {!isABC ? (
        // NUMERIC VIEW
        numberKeys.map((row, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => handlePress(key)}
                style={{
                  backgroundColor: colors.card,
                  width: "31%",
                  paddingVertical: 18,
                  borderRadius: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))
      ) : (
        // ALPHABET VIEW
        letterKeys.map((row, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => handlePress(key)}
                style={{
                  backgroundColor: key === "C" ? colors.danger : colors.card,
                  width: "18%",
                  paddingVertical: 15,
                  borderRadius: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: key === "C" ? colors.danger : colors.border,
                }}
              >
                <Text style={{ color: key === "C" ? "#fff" : colors.text, fontSize: 16, fontWeight: "bold" }}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}

      {/* FOOTER CLEAR FOR NUMERIC MODE */}
      {!isABC && (
        <TouchableOpacity
          onPress={() => handlePress("C")}
          style={{
            backgroundColor: colors.danger,
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 5,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>CLEAR ALL</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Keypad;