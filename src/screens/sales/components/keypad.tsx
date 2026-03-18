import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
const Keypad = ({ value, onChange }: any) => {

    const handlePress = (key: string) => {

        if (key === "C") {
            onChange("");
            return;
        }

        if (key === "⌫") {
            onChange(value.slice(0, -1));
            return;
        }

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
        <View className="mt-6">

            {keys.map((row, i) => (
                <View key={i} className="flex-row justify-between mb-3">

                    {row.map((key) => (
                        <TouchableOpacity
                            key={key}
                            onPress={() => handlePress(key)}
                            className="bg-slate-800 w-[30%] py-6 rounded-lg items-center"
                        >
                            <Text className="text-white text-xl font-bold">{key}</Text>
                        </TouchableOpacity>
                    ))}

                </View>
            ))}

            <TouchableOpacity
                onPress={() => handlePress("C")}
                className="bg-red-600 py-5 rounded-lg items-center mt-2"
            >
                <Text className="text-white font-bold text-lg">CLEAR</Text>
            </TouchableOpacity>

        </View>
    );
};

export default Keypad