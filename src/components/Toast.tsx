import { View, Text } from 'react-native'
import React from 'react'

const Toast: any = ({ msg, state }: any) => {
    return (
        <View className={`${state === "error" ? "bg-red-500" : "bg-green-400"} p-2 min-w-[300px] rounded-md mb-4`}>
            <Text className="text-white text-center">{msg}</Text>
        </View>
    )
}

export default Toast