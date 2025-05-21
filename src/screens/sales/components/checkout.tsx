import { View, Text, Modal, TextInput, Dimensions } from 'react-native'
import React, { useState } from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import { authorizedFetch } from '../../../middleware/auth.middleware';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { CartItem, ProductItem } from '../../../../models';
import { FlatList } from 'react-native';


const CheckoutModal = ({ modalVisible, cartItems, PostLocally, setModalVisible }: any) => {

    const calculateSubtotal = (item: CartItem) => item.price * item.quantity;
    const grandTotal = cartItems.reduce((sum: any, item: any) => sum + calculateSubtotal(item), 0);

    return (

        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(!modalVisible);
            }}>
            <View className="flex-1 px-2 bg-slate-900">
                <View className="bg-green-100 dark:bg-slate-800 p-4 min-h-3/4 mt-20 h-3/4 rounded-lg shadow-md">
                    <Text className="text-xl font-bold mb-3 text-slate-900 dark:text-white">🛒 Checkout</Text>

                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-slate-800 dark:text-slate-200">
                                    {item.product_name} x {item.quantity}
                                </Text>
                                <Text className="text-slate-800 dark:text-slate-200">
                                    Ksh {calculateSubtotal(item).toFixed(2)}
                                </Text>
                            </View>
                        )}
                    />

                    <View className="border-t dark:border-gray-300 border-gray-600 mt-3 pt-3">
                        <Text className="text-lg font-semibold text-right text-slate-900 dark:text-white">
                            Grand Total: Ksh {grandTotal.toFixed(2)}
                        </Text>
                    </View>

                    {/* Checkout Button */}
                    <View className='w-full flex-row '>
                        <View className="mt-2 w-1/2 px-2 ">
                            <Button handleclick={() => setModalVisible(false)} outline loading={false} title="Cancel" />
                        </View>
                        <View className="mt-2 w-1/2 px-2">
                            <Button handleclick={PostLocally} loading={false} title="CheckOut" />

                            {/* Cancel Button */}
                        </View>

                    </View>

                </View>
            </View>
        </Modal>


    )
}

export default CheckoutModal