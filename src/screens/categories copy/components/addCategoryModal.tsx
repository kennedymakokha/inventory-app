import { View, Text, Modal, TextInput, TouchableOpacity, Platform } from 'react-native'
import React, { useState } from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import { authorizedFetch } from '../../../middleware/auth.middleware';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { CategoryItem, ProductItem } from '../../../../models';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Theme } from '../../../utils/theme';

const AddProductModal = ({ modalVisible,isDarkMode, msg, setMsg, setItem, PostLocally, fetchProducts, item, setModalVisible }: any) => {
    const [showPicker, setShowPicker] = useState(false);
      const theme = isDarkMode ? Theme.dark : Theme.light;
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
            <View className='flex-1 px-10  bg-secondary-900 justify-center'>
                <Text className="text-2xl font-bold text-center uppercase text-green-500 mb-5">New Product</Text>

                <InputContainer
                    label="Name"
                    placeholder="category name"
                    value={item.category_name}
                    onChangeText={(text: string) => handleChange("category_name", text)}
                    keyboardType="text"
                />

              
              
               
                <TextArea
                    placeholder="category description ..."
                    value={item.description}
                    theme={theme}
                    isDarkMode={isDarkMode}
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