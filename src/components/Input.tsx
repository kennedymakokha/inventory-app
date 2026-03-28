import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Switched to Ionicons for consistency
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
    const { colors, isDarkMode } = useTheme();

    // Context-aware background colors
    const containerBg = latlng === 'yes' && !editable
        ? (isDarkMode ? '#1E293B' : '#E2E8F0') 
        : colors.card;

    return (
        <View style={[styles.wrapper, { marginBottom: 16 }]}>
            {label && (
                <Text style={[styles.label, { color: colors.primary }]}>
                    {label}
                </Text>
            )}
            <View 
                style={[
                    styles.inputContainer, 
                    { 
                        backgroundColor: containerBg, 
                        borderColor: colors.border,
                        opacity: editable ? 1 : 0.7 
                    }
                ]}
            >
                <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.subText}
                    value={value?.toString()}
                    onChangeText={onChangeText}
                    secureTextEntry={hide}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    editable={editable}
                    cursorColor={colors.primary}
                    selectionColor={colors.primary + '40'}
                />
                {hide !== undefined && setHide && (
                    <Icon
                        name={hide ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.subText}
                        onPress={setHide}
                        style={styles.icon}
                    />
                )}
            </View>
        </View>
    );
};

export const InputContainer: React.FC<InputProps> = ({
    value,
    onChangeText,
    editable = true,
    placeholder,
    label,
    hide,
    multiline = false,
}) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.wrapper, { marginBottom: 12 }]}>
            {label && (
                <Text style={[styles.label, { color: colors.primary, fontSize: 11 }]}>
                    {label}
                </Text>
            )}
            <View style={[
                styles.minimalContainer, 
                { backgroundColor: colors.card, borderColor: colors.border }
            ]}>
                <TextInput
                    style={[styles.textInput, { color: colors.text, height: 48 }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.subText}
                    value={value?.toString()}
                    onChangeText={onChangeText}
                    secureTextEntry={hide}
                    editable={editable}
                    multiline={multiline}
                    cursorColor={colors.primary}
                />
            </View>
        </View>
    );
};

export const TextArea: React.FC<{
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    label?: string;
}> = ({ value, onChangeText, placeholder, label }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.wrapper}>
            {label && (
                <Text style={[styles.label, { color: colors.primary }]}>
                    {label}
                </Text>
            )}
            <TextInput
                style={[
                    styles.textArea,
                    {
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        color: colors.text,
                    }
                ]}
                placeholder={placeholder}
                placeholderTextColor={colors.subText}
                multiline
                numberOfLines={4}
                value={value?.toString()}
                onChangeText={onChangeText}
                cursorColor={colors.primary}
                textAlignVertical="top"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        height: 56,
    },
    minimalContainer: {
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    textArea: {
        minHeight: 120,
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        fontSize: 15,
        fontWeight: '500',
    },
    icon: {
        padding: 4,
    }
});

export default Input;