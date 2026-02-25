// components/ListItemRenderer.js
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';

import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/FontAwesome5'
import { FormatDate, getDaysBetween, getDurationFromNow } from '../../../../utils/formatDate';
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth);
const itemLargeWidth = (screenWidth);
const renderItem = ({ item }: any) => (
    <View className={`flex-row ${item.synced===0?"bg-red-100":"bg-green-100"} mx-4 my-2 rounded-xl shadow p-3 items-center`}  >
        {/* <Image source={item.image} className="w-12 h-8 mr-4 resize-contain" /> */}
        < View className="flex-1 " >
            <View className="flex-row gap-x-2 items-center">
                <View>
                    <Text className="font-bold text-base">{item.product_name}</Text>
                </View>
            </View>
            <Text className="text-gray-500 text-xs">{item.description}</Text>
            <View className="flex-row justify-between items-center mt-2">
                <View className="bg-slate-400 px-2 py-1 rounded">
                    <Text className="text-xs text-slate-900">{item.quantity} {item.quantity !== 1 ? 'pcs' : 'pc'}</Text>
                </View>
                <Text className="font-bold text-base text-green-700">Ksh {item.price.toFixed(2)}</Text>
            </View>
        </View >
    </View >

);

export default renderItem;
