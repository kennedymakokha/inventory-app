import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'

const Button = ({ handleclick, outline, title, loading }: { outline?: boolean, handleclick: any, title: any, loading: boolean }) => {
    return (
        <TouchableOpacity activeOpacity={1}
            className={`${outline ? " border border-primary-500 text-secondary-600" : "bg-primary-500"} py-3 px-2 w-full rounded-xl`}
            onPress={loading ? console.log("") : handleclick}
        >
            {loading ? <ActivityIndicator color="white" size={20} /> : <Text className={`text-center tracking-widest uppercase font-bold ${outline ? "text-primary-500" : "text-secondary-800"} font-semibold text-lg`}>
                {title}
            </Text>}
        </TouchableOpacity>
    )
}

export const Fab = ({ handleclick, outline, title, loading }: { outline?: boolean, handleclick: any, title: any, loading: boolean }) => {
    return (
        <TouchableOpacity activeOpacity={0.8}
            className={`${outline ? " border border-primary-500 text-secondary-600" : "bg-primary-500"} py-3 px-2 size-20 items-center justify-center rounded-xl`}
            onPress={loading ? console.log("") : handleclick}
        >
            {loading ? <ActivityIndicator color="white" size={20} /> : <Text className={`text-center tracking-widest uppercase font-bold ${outline ? "text-primary-500" : "text-secondary-800"} font-semibold text-lg`}>
                {title}
            </Text>}
        </TouchableOpacity>
    )
}

export default Button