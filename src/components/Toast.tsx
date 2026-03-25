import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import Icon from 'react-native-vector-icons/FontAwesome5'
const Toast = ({ msg, state, setMsg, small }: any) => {

  useEffect(() => {
    if (!msg) return;

    const timer = setTimeout(() => {
      setMsg("");
    }, 6000); // 1 minute

    return () => clearTimeout(timer);
  }, [msg]);

  if (!msg) return null;

  return (
    <>
      {small ? <View className='flex items-center flex-row  justify-end px-10'>
        <View className={`${state === "error" ? "bg-red-500" : "bg-green-400"}  float-end p-2  size-8 flex items-center justify-center  rounded-md mb-4`}>
          <Icon name={`${state === "error" ? "window-close" : "check"}`} size={14} />
        </View>
      </View> :
        <View className='flex items-center flex-row  justify-center px-10'>
          <View className={`${state === "error" ? "bg-red-500" : "bg-green-400"} p-2 min-w-[300px] rounded-md mb-4`}>
            <Text className="text-white text-center">{msg}</Text>
          </View>
        </View>}
    </>

  )
}

export default Toast