import { View, Text, TextInput } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Entypo'

import { useColorScheme } from 'react-native';
import { InputProps } from '../../models';
import { Theme } from '../utils/theme';



export const Input: React.FC<InputProps> = ({
    value,
    keyboardType,
    latlng,
    onChangeText,
    editable = true,
    multiline = false,
    placeholder,
    label, hide, setHide
}) => {
    const theme = useColorScheme(); // 'dark' or 'light'
    const isDark = theme === 'dark';

    const containerBg = latlng === 'yes' && !editable
        ? 'bg-slate-300 dark:bg-slate-700'
        : isDark
            ? 'bg-gray-800'
            : 'bg-primary-50';

    return (
        <View className="flex w-full  h-20  mb-4 rounded-xl bg-primary-100 justify-center">
            {label && <Text className='px-2  tracking-widest pt-2 uppercase text-gold-500 font-bold'>{label}</Text>}
            <View className="flex flex-row  items-center justify-between px-4">
                <TextInput
                    className=" rounded-xl text-secodary-500"
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    secureTextEntry={hide}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                />
                {hide !== undefined && <Icon onPress={setHide} name={hide ? "eye" : "eye-with-line"} size={30} color="#333333" />}
            </View>

        </View>

    );
};




export const InputContainer: React.FC<any> = ({
    value,
    keyboardType,
    latlng,
    onChangeText,
    disabled,
    editable,
    multiline = false,
    isDarkMode, // Prop from parent
    placeholder,
    hide,
}) => {
    // 1. Priority: Use isDarkMode prop if provided, otherwise fallback to system theme
    const systemTheme = useColorScheme() === 'dark';
    const isDark = isDarkMode !== undefined ? isDarkMode : systemTheme;

    // 2. Dynamic Background Logic
    const containerBg = latlng === 'yes' && !editable
        ? (isDark ? 'bg-slate-700' : 'bg-slate-300')
        : (isDark ? 'bg-slate-800' : 'bg-slate-100');

    // 3. Dynamic Text Logic
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const placeholderColor = isDark ? '#94a3b8' : '#64748b';

    return (
        <View
            className={`flex w-full h-14 mb-4 rounded-lg justify-center border ${isDark ? 'border-slate-700' : 'border-slate-200'
                } ${containerBg}`}
        >
            <View>
                <TextInput
                    className={`px-4 py-1 text-lg font-semibold ${textColor}`}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderColor}
                    value={value?.toString()} // Ensure value is a string
                    onChangeText={onChangeText}
                    secureTextEntry={hide}
                    editable={disabled ? false : editable}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    textAlignVertical="center"
                    // On some versions of RN, cursor color needs manual setting for dark mode
                    cursorColor={isDark ? '#3b82f6' : '#1e293b'}
                />
            </View>
        </View>
    );
};

export const TextArea = ({ value, isDarkMode, theme, onChangeText, placeholder }: { theme: any, isDarkMode: boolean, placeholder?: string, value: string | any, onChangeText: any, }) => {


    return (

        <TextInput
            className={`min-h-[100px] border font-semibold text-lg mt-2 mb-5 rounded-xl p-4 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
            placeholder={placeholder}
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={value?.toString()}
            onChangeText={onChangeText}
            // Sync cursor color with primary brand or text
            cursorColor={isDarkMode ? '#3b82f6' : '#1e293b'}
        />

    )
}


export default Input