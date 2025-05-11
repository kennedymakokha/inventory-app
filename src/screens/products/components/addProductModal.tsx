import { View, Text, Modal, TextInput, TouchableOpacity, Platform } from 'react-native'
import React, { useState } from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import { authorizedFetch } from '../../../middleware/auth.middleware';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { ProductItem } from '../../../../models';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddProductModal = ({ modalVisible, msg, setMsg, setItem, PostLocally, fetchProducts, item, setModalVisible }: any) => {
    const [showPicker, setShowPicker] = useState(false);
    const handleChange = (key: keyof ProductItem, value: string) => {
        setMsg({ msg: "", state: "" });

        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1000);

    return (

        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(!modalVisible);
            }}>
            <View className='flex-1 px-10  bg-secondary-900 justify-center'>
                <Text className="text-2xl font-bold text-center uppercase text-green-500 mb-5">New Product</Text>

                <InputContainer
                    label="Product"
                    placeholder="Product"
                    value={item.product_name}
                    onChangeText={(text: string) => handleChange("product_name", text)}
                    keyboardType="text"
                />

                <InputContainer
                    label="Buying Price"
                    placeholder="Buying Price"
                    value={item.Bprice}
                    onChangeText={(text: string) => handleChange("Bprice", text)}
                    keyboardType="numeric"
                />
                <InputContainer
                    label="Seling Price"
                    placeholder="Selling price"
                    value={item.price}
                    onChangeText={(text: string) => handleChange("price", text)}
                    keyboardType="numeric"
                />
                <InputContainer
                    label="Initial Stock"
                    placeholder="initial Stock"
                    value={item.initial_stock}
                    onChangeText={(text: string) => handleChange("initial_stock", text)}
                    keyboardType="numeric"
                />
                <View>
                    {item.initial_stock && <TouchableOpacity
                        onPress={() => setShowPicker(true)}
                        className="border  border-gray-300 h-14 flex justify-center bg-secondary-50 rounded-md px-4 py-2 my-2 bg-white"
                    >
                        <Text className="text-black text-lg font-bold  text-base text-secodary-500">
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Select Expiry Date'}
                        </Text>
                    </TouchableOpacity>}

                    {showPicker && (
                        <DateTimePicker
                            value={item.expiryDate ? new Date(item.expiryDate) : new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowPicker(Platform.OS === 'ios'); // stays open on iOS
                                if (selectedDate) {
                                    setItem((prev: any) => ({
                                        ...prev,
                                        expiryDate: selectedDate.toISOString(),
                                    }));
                                }
                            }}
                        />
                    )}
                </View>
                <TextArea
                    placeholder="Product description ..."
                    value={item.description}
                    onChangeText={(text: string) => handleChange("description", text)}
                />
                {msg.msg && <Toast msg={msg.msg} state={msg.state} />}
                <View className="flex w-full flex-row  ">
                    <View className="flex w-1/2 flex-row justify-center px-2 items-center">
                        <Button handleclick={() => setModalVisible(!modalVisible)} outline loading={false} title="cancel" />
                    </View>
                    <View className="flex w-1/2 flex-row px-2 justify-center items-center">
                        <Button handleclick={PostLocally} loading={false} title="submit" />
                    </View>
                </View>


            </View>
        </Modal>

    )
}

export default AddProductModal