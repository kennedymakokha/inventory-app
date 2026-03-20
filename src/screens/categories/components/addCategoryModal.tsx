import { View, Text, Modal, TextInput, TouchableOpacity, Platform } from 'react-native'
import React, { useState } from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import { authorizedFetch } from '../../../middleware/auth.middleware';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { CategoryItem, ProductItem } from '../../../../models';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Theme } from '../../../utils/theme';
import { useTheme } from '../../../context/themeContext';

const AddProductModal = ({ modalVisible, onClose, msg, setMsg, setItem, PostLocally, fetchProducts, item, setModalVisible }: any) => {
    const { colors, isDarkMode } = useTheme();
    const handleChange = (key: keyof CategoryItem, value: string) => {
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
            <View style={{ backgroundColor: colors.background }} className='flex-1 px-10   justify-center'>
                <View style={{ borderColor: colors.border }} className="flex flex-col h-1/2 border px-2 py-4">
                    <Text style={{ color: colors.primary }} className="text-2xl font-bold text-center uppercase  mb-5">New Product</Text>

                    <InputContainer
                        label="Name"
                        placeholder="category name"
                        value={item?.category_name}
                        onChangeText={(text: string) => handleChange("category_name", text)}
                        keyboardType="text"
                    />

                    <TextArea

                        placeholder="category description ..."
                        value={item?.description}
                        onChangeText={(text: string) => handleChange("description", text)}
                    />
                    {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}
                    <View className="flex w-full flex-row mt-10 ">
                        <View className="flex w-1/2 flex-row justify-center px-2 items-center">
                            <Button handleclick={onClose} outline loading={false} title="cancel" />
                        </View>
                        <View className="flex w-1/2 flex-row px-2 justify-center items-center">
                            <Button handleclick={PostLocally} loading={false} title={item?.category_id ? "Update" : "submit"} />
                        </View>
                    </View>

                </View>

            </View>
        </Modal>

    )
}

export default AddProductModal