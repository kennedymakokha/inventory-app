import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { FormatDate } from '../../utils/formatDate'
import AsyncStorage from '@react-native-async-storage/async-storage'
import SearchBar from './searchBar'

const PageHeader = ({ component }: { component?: () => React.ReactNode | any }) => {
    let user
    useEffect(() => {
        const userobj = async () => {
            await AsyncStorage.getItem('user');
        }
        user = userobj()
    }, [])
   
    return (
        <View className="bg-green-700 p-4 rounded-b-xl">
            <View>
                <Text className="text-white text-xl font-bold">Joana Leite</Text>
                <View className="bg-gray-200 px-2 py-1 rounded mt-1 self-start">
                    <Text className="text-xs font-semibold text-gray-700">SO-00001</Text>
                </View>
                <Text className="text-white text-xs mt-1">Req.date {FormatDate(Date())}</Text>
                {component ? component() : <SearchBar white placeholder="search for a Product" />}
            </View>
        </View>
    )
}

export default PageHeader