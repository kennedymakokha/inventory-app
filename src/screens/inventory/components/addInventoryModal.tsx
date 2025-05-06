import { View, Text, Modal, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import { authorizedFetch } from '../../../middleware/auth.middleware';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { InventoryItem, ProductItem } from '../../../../models';
import SelectInput from '../../../components/sellectInput';
import { getProducts } from '../../../services/product.service';
import { getDBConnection } from '../../../services/db-service';
import { toDropdownOptions } from '../../../../utils/useDropDown';



const InventoryModal = ({ modalVisible, closeModal, product, msg, setMsg, setItem, PostLocally, item }: any) => {
    const handleChange = (key: keyof InventoryItem, value: string) => {
        setMsg({ msg: "", state: "" });

        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    }
    const [products, setProducts] = useState<ProductItem[]>([]);
    const fetchProducts = async () => {
        const db = await getDBConnection();
        let products = await getProducts(db)
        setProducts(products)
    }
    useEffect(() => {
        fetchProducts()
    }, [])


    return (

        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={closeModal}>
            <View className='flex-1 px-10  bg-secondary-900 justify-center'>
                <Text className="text-2xl font-bold text-center text-primary-500 mb-5">{product ? `${product.product_name} stocking` : "New Stock"}</Text>

                <SelectInput
                    label="Select Product "
                    value={item.product_id}
                    valuExists={product?.product_name}
                    onChange={(e: any) => handleChange("product_id", e)}
                    options={toDropdownOptions(products, "product_name", "id")}
                />

                <InputContainer
                    label="quantity"
                    placeholder="quantity"
                    value={item.quantity}
                    onChangeText={(text: string) => handleChange("quantity", text)}
                    keyboardType="numeric"
                />

                {msg.msg && <Toast msg={msg.msg} state={msg.state} />}
                <View className="flex w-full flex-row  ">
                    <View className="flex w-1/2 flex-row justify-center px-2 items-center">
                        <Button handleclick={closeModal} outline loading={false} title="cancel" />
                    </View>
                    <View className="flex w-1/2 flex-row px-2 justify-center items-center">
                        <Button handleclick={PostLocally} loading={false} title="submit" />
                    </View>
                </View>


            </View>
        </Modal>

    )
}

export default InventoryModal