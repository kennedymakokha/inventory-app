import { View, Text, TextInput } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Entypo'

import { useColorScheme } from 'react-native';
import { InputProps } from '../../models';



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



export const InputContainer: React.FC<InputProps> = ({
    value,
    keyboardType,
    latlng,
    onChangeText,
    editable = true,
    multiline = false,
    placeholder,
    hide,
    setHide
}) => {
    const theme = useColorScheme(); // 'dark' or 'light'
    const isDark = theme === 'dark';

    const containerBg = latlng === 'yes' && !editable
        ? 'bg-slate-300 dark:bg-slate-700'
        : isDark
            ? 'bg-gray-800'
            : 'bg-primary-50';

    return (
        <View className={`flex w-full h-14 mb-4 bg-green-100  rounded-lg justify-center ${containerBg}`} >
            <View>
                {/* {value && <View className='px-4'>
                    <Text className={` ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {placeholder}
                    </Text>
                </View>} */}
                <TextInput className={`px-4 py-1 text-lg font-bold text-base rounded-lg ${isDark ? 'text-secondary-600' : 'text-gray-900'}`}
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? '#aaa' : '#666'}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={hide}
                    editable={editable}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    textAlignVertical="top"
                />
            </View>

        </View>
    );
};

export const TextArea = ({ value, onChangeText, placeholder }: { placeholder?: string, value: string | any, onChangeText: any, }) => {
    return (

        <TextInput
            className="min-h-[30%] border font-bold text-lg mt-2 mb-5 text-secodary-500  bg-green-100 rounded-xl p-4 "
            placeholder={placeholder}
            placeholderTextColor={"gray"}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            value={value}
            onChangeText={onChangeText}
        />

    )
}


export default Input