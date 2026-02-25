import React from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity } from 'react-native';
;
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/pageHeader';
import { Theme } from '../utils/theme';

const SettingsScreen = () => {
    const { isScanToCartEnabled, setScanToCart, isDarkMode, setDarkMode } = useSettings();

  const theme = isDarkMode?Theme.dark:Theme.light

    return (
        <View className={`flex-1 ${theme.background}`}>
            <PageHeader component={() => <Text className="text-white font-bold text-xl uppercase tracking-widest">System Settings</Text>} />
            
            <ScrollView className="p-4">
                <Text className={`mb-4 font-bold uppercase ${theme.subText}`}>Inventory & Sales</Text>
                
                {/* Scan to Cart Toggle */}
                <View className={`${theme.card} p-5 rounded-3xl flex-row justify-between items-center mb-4 shadow-sm`}>
                    <View className="flex-1 pr-4">
                        <View className="flex-row items-center mb-1">
                            <Icon name="barcode" size={18} color="#22c55e" className="mr-2" />
                            <Text className={`text-lg font-bold ${theme.text}`}> Scan to Cart</Text>
                        </View>
                        <Text className={theme.subText}>If enabled, scanning a barcode adds the item directly to the cart with quantity 1.</Text>
                    </View>
                    <Switch 
                        value={isScanToCartEnabled} 
                        onValueChange={setScanToCart}
                        trackColor={{ false: '#767577', true: '#22c55e' }}
                        thumbColor={isScanToCartEnabled ? '#f4f3f4' : '#f4f3f4'}
                    />
                </View>

                <Text className={`mb-4 mt-4 font-bold uppercase ${theme.subText}`}>Appearance</Text>

                {/* Dark Mode Toggle */}
                <View className={`${theme.card} p-5 rounded-3xl flex-row justify-between items-center mb-4 shadow-sm`}>
                    <View className="flex-1 pr-4">
                        <View className="flex-row items-center mb-1">
                            <Icon name="moon" size={18} color="#3b82f6" className="mr-2" />
                            <Text className={`text-lg font-bold ${theme.text}`}> Dark Mode</Text>
                        </View>
                        <Text className={theme.subText}>Adjust the interface for low-light environments.</Text>
                    </View>
                    <Switch 
                        value={isDarkMode} 
                        onValueChange={setDarkMode}
                        trackColor={{ false: '#767577', true: '#3b82f6' }}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

export default SettingsScreen;