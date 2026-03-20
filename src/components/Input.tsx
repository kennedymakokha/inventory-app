// components/Input.tsx
import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import { useTheme } from '../context/themeContext';
import { InputProps } from '../../models';




export const Input: React.FC<InputProps> = ({
    value,
    onChangeText,
    editable = true,
    placeholder,
    label,
    hide,
    setHide,
    latlng,
    keyboardType,
    multiline = false,
}) => {
    const { colors } = useTheme();

    // Dynamic background
    const containerBg = latlng === 'yes' && !editable
        ? colors.border
        : colors.inputBg;

    return (
        <View style={{ width: '100%', marginBottom: 16, borderRadius: 5, backgroundColor: containerBg, paddingVertical: 4 }}>
            {label && <Text style={{ marginLeft: 8, marginBottom: 4, fontWeight: 'bold', color: colors.primary }}>{label}</Text>}

            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
                <TextInput
                    style={{ flex: 1, color: colors.text, fontSize: 16, paddingVertical: 8 }}
                    placeholder={placeholder}
                    placeholderTextColor={colors.placeholder}
                    value={value?.toString()}
                    onChangeText={onChangeText}
                    secureTextEntry={hide}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    editable={editable}
                    cursorColor={colors.primary}
                />
                {hide !== undefined && setHide && (
                    <Icon
                        name={hide ? 'eye' : 'eye-with-line'}
                        size={24}
                        color={colors.subText}
                        onPress={setHide}
                    />
                )}
            </View>
        </View>
    );
};

export const InputContainer: React.FC<InputProps & { isDarkMode?: boolean }> = ({
    value,
    onChangeText,
    editable = true,
    placeholder,
    hide,
    setHide,
    multiline = false,
}) => {
    const { colors } = useTheme();

    return (
        <View style={{
            width: '100%',
            height: 56,
            marginBottom: 16,
            borderRadius: 5,
            backgroundColor: colors.inputBg,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            paddingHorizontal: 12,
        }}>
            <TextInput
                style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}
                placeholder={placeholder}
                placeholderTextColor={colors.placeholder}
                value={value?.toString()}
                onChangeText={onChangeText}
                secureTextEntry={hide}
                editable={editable}
                multiline={multiline}
                textAlignVertical="center"
                cursorColor={colors.primary}
            />
        </View>
    );
};

export const TextArea: React.FC<{
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}> = ({ value, onChangeText, placeholder }) => {
    const { colors } = useTheme();

    return (
        <TextInput
            style={{
                minHeight: 100,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.inputBg,
                color: colors.text,
                fontSize: 16,
                fontWeight: '500',
                padding: 12,
                marginVertical: 8,
                textAlignVertical: 'top',
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            value={value?.toString()}
            onChangeText={onChangeText}
            cursorColor={colors.primary}
        />
    );
};

export default Input;