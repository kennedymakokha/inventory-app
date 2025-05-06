import { View, Text, Modal, TextInput } from 'react-native'
import React, { useState } from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import { authorizedFetch } from '../../../middleware/auth.middleware';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { ProductItem } from '../../../../models';


const AddProductModal = ({ modalVisible, msg, setMsg, setItem, PostLocally, fetchProducts, item, setModalVisible }: any) => {
    const handleChange = (key: keyof ProductItem, value: string) => {
        setMsg({ msg: "", state: "" });

        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    }


    return (

        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(!modalVisible);
            }}>
            <View className='flex-1 px-10  bg-secondary-900 justify-center'>
                <Text className="text-2xl font-bold text-center text-primary-500 mb-5">New Product</Text>

                <InputContainer
                    label="Product"
                    placeholder="Product"
                    value={item.product_name}
                    onChangeText={(text: string) => handleChange("product_name", text)}
                    keyboardType="text"
                />
                <InputContainer
                    label="Seling Price"
                    placeholder="price"
                    value={item.price}
                    onChangeText={(text: string) => handleChange("price", text)}
                    keyboardType="numeric"
                />
                <InputContainer
                    label="Buying Price"
                    placeholder="Bprice"
                    value={item.Bprice}
                    onChangeText={(text: string) => handleChange("Bprice", text)}
                    keyboardType="numeric"
                />
                <TextArea
                    // className=""
                    // multiline
                    // numberOfLines={10}
                    // textAlignVertical="top" // ensures the text starts at the top
                    placeholder="Type your message..."
                    // placeholderTextColor="#999"
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