import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SkeletonList } from './skeleton';
import { useState } from 'react';
import SearchBar from '../../components/searchBar';
import { Fab } from '../../components/Button';


const inventoryData = [
    { id: "1", name: "Laptop", stock: 12, price: "$1200" },
    { id: "2", name: "Phone", stock: 5, price: "$700" },
    { id: "3", name: "Keyboard", stock: 30, price: "$50" },
];

export default function InventoryScreen() {
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadmodalVisible, setUploadModalVisible] = useState(false);

    const onUploadPress = async () => {
        // try {
        //     const db = await getDBConnection();
        //     await handleCSVUpload(db);
        //     Alert.alert("Success", "CSV file uploaded and imported.");
        // } catch (error) {
        //     Alert.alert("Error", "Failed to upload CSV.");
        // }
    };
    return (

        <View className="flex-1 min-h-[300px] bg-secondary-900 px-5">

            <View className="flex-1 ">
             

                {loading ? (
                    <SkeletonList />
                ) : <FlatList
                    data={inventoryData}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View className="flex-row justify-between bg-slate-100 p-4 rounded-lg shadow-md mt-2">
                            <View>
                                <Text className="font-bold text-secondary-900 text-lg">{item.name}</Text>
                                <Text className="text-gray-600">Stock: {item.stock}</Text>
                                <Text className="text-primary-500 font-bold">Price: {item.price}</Text>
                            </View>
                            {/* Restock Button */}
                            <TouchableOpacity className="bg-secondary-600 p-2  rounded">
                                <Text className="text-white">Restock</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />}


                {/* <AddProductModal
                    setMsg={setMsg}
                    msg={msg}
                    PostLocally={AddProduct}
                    modalVisible={modalVisible}
                    setItem={setItem}
                    fetchProducts={loadDataCallback}
                    item={item}
                    setModalVisible={setModalVisible}
                />
                <UploadProductsModal
                    setMsg={setMsg}
                    msg={msg}
                    PostLocally={AddProduct}
                    modalVisible={uploadmodalVisible}
                    setItem={setItem}
                    fetchProducts={loadDataCallback}
                    item={item}
                    setModalVisible={setUploadModalVisible}
                /> */}
            </View>

            {/* Floating Button */}
            <View className="absolute bottom-5 left-5 gap-y-5 right-5 z-50 items-center">
                <View className="flex-row w-full justify-between ">
                    <Fab icon="upload-to-cloud" outline loading={false} title="+" handleclick={onUploadPress} />

                    <Fab icon="plus" loading={false} title="+" handleclick={() => setModalVisible(true)} />

                    {/* {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" />
                ) : (
                    <Fab outline loading={false}
                        title="Sync Now"
                        handleclick={handleSync} />
                )} */}
                </View>

            </View>
        </View>

    );
}
