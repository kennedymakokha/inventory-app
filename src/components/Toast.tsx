import { View, Text } from 'react-native'
import React, { useEffect } from 'react'

const Toast = ({ msg, state, setMsg }: any) => {

  useEffect(() => {
    if (!msg) return;

    const timer = setTimeout(() => {
      setMsg("");
    }, 6000); // 1 minute

    return () => clearTimeout(timer);
  }, [msg]);

  if (!msg) return null;

  return (
    <View className={`${state === "error" ? "bg-red-500" : "bg-green-400"} p-2 min-w-[300px] rounded-md mb-4`}>
      <Text className="text-white text-center">{msg}</Text>
    </View>
  )
}

export default Toast