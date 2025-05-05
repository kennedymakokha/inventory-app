// components/ListItemRenderer.js
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';

import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/FontAwesome5'
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth);
const itemLargeWidth = (screenWidth);
const renderItem = ({ item }: any) => (
    <View className={`flex-row justify-between w-[50%] rounded-md  h-40 items-center p-1 sm:p-3`}>

        <View className={`flex items-center gap-y-2 w-full  shadow-3xl ${item.synced === 0 ? "bg-primary-100" : "bg-primary-50"}  h-full rounded-md justify-center`}>
            
            <Text className="text-base  text-sm sm:text-2xl  uppercase text-center font-bold tracking-widest">
                {item.product_name}
            </Text>
            <Text className="text-base b-2 bg-secondary-300  rounded-md  px-2 ">
                Ksh {item.price}
            </Text>
            <View className='flex items-center flex-row justify-between w-full px-5'>
                <View className="flex size-2 sm:size-10 rounded-full shadow-3xl items-center justify-center  bg-primary-300">
                    <Icon name="edit" className='size-10 text-secondary-500' />
                </View>
                {/*<View className="flex size-10 rounded-full shadow-3xl items-center justify-center  bg-primary-300">
                    <Icon name="eye-off" className='size-10 text-secondary-500' />
                </View>
                <View className="flex size-10 rounded-full shadow-3xl items-center justify-center  bg-primary-300">
                    <Icon name="delete" className='size-10 text-secondary-500' />
                </View> */}

            </View>

        </View>

    </View>

);

export default renderItem;
