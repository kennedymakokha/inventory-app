import { View, Text, Modal, TextInput, Dimensions } from 'react-native'
import React, { useState } from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import { authorizedFetch } from '../../../middleware/auth.middleware';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { CartItem, ProductItem } from '../../../../models';
import { FlatList } from 'react-native';


const CheckoutModal = ({ modalVisible, cartItems, msg, setMsg, setItem, PostLocally, fetchProducts, item, setModalVisible }: any) => {
    const handleChange = (key: keyof ProductItem, value: string) => {
        setMsg({ msg: "", state: "" });

        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    }
    const calculateSubtotal = (item: CartItem) => item.price * item.quantity;
    const grandTotal = cartItems.reduce((sum: any, item: any) => sum + calculateSubtotal(item), 0);
    const screenHight = Dimensions.get('window').height

    return (

        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(!modalVisible);
            }}>
            <View className="flex-1 mt-14 px-2" style={{ height: screenHight }}>
                <View className="bg-slate-200 dark:bg-slate-800 p-4 min-h-full h-full rounded-lg shadow-md">
                    <Text className="text-xl font-bold mb-3 text-slate-900 dark:text-white">🛒 Checkout</Text>

                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-slate-800  dark:text-slate-200">
                                    {item.product_name} x {item.quantity}
                                </Text>
                                <Text className="text-slate-800 dark:text-slate-200">
                                    Ksh {calculateSubtotal(item).toFixed(2)}
                                </Text>
                            </View>
                        )}
                    />

                    <View className="border-t border-gray-300 dark:border-gray-600 mt-3 pt-3">
                        <Text className="text-lg font-semibold text-right text-slate-900 dark:text-white">
                            Grand Total:Ksh {grandTotal.toFixed(2)}
                        </Text>
                    </View>
                    <Button handleclick={PostLocally} loading={false} title="CheckOut" />
                </View>
            </View>

        </Modal>

    )
}

export default CheckoutModal