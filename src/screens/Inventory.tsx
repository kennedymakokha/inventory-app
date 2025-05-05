import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';

interface InventoryItem {
  _id?: string;
  product: string;
  quantity: number;
}

const InventoryScreen = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');

  const fetchInventory = async () => {
    try {
      const res = await axios.get('http://<YOUR_SERVER>/api/inventory');
      setInventory(res.data);
    } catch {
      Alert.alert('Error', 'Failed to fetch inventory');
    }
  };

  const addInventory = async () => {
    if (!product || !quantity) return;
    try {
      await axios.post('http://<YOUR_SERVER>/api/inventory', {
        product,
        quantity: parseInt(quantity, 10),
      });
      setProduct('');
      setQuantity('');
      fetchInventory();
    } catch {
      Alert.alert('Error', 'Failed to add inventory');
    }
  };

  const deleteInventory = async (id: string) => {
    try {
      await axios.delete(`http://<YOUR_SERVER>/api/inventory/${id}`);
      fetchInventory();
    } catch {
      Alert.alert('Error', 'Failed to delete inventory');
    }
  };

  return (
    <View className="flex-1 p-5">
      <Text className="text-2xl font-bold text-center mb-5">Inventory Management</Text>

      <TextInput
        className="h-10 border border-gray-400 rounded px-3 mb-3"
        placeholder="Product Name"
        value={product}
        onChangeText={setProduct}
      />

      <TextInput
        className="h-10 border border-gray-400 rounded px-3 mb-4"
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      <TouchableOpacity
        onPress={addInventory}
        className="bg-blue-500 py-3 rounded mb-4"
      >
        <Text className="text-white text-center font-semibold">Add Inventory</Text>
      </TouchableOpacity>

      <FlatList
        data={inventory}
        keyExtractor={(item) => item._id || item.product}
        renderItem={({ item }) => (
          <View className="flex-row justify-between items-center border-b border-gray-300 py-3">
            <Text className="text-base">{item.product} - {item.quantity}</Text>
            <TouchableOpacity
              onPress={() => deleteInventory(item._id!)}
              className="bg-red-500 px-3 py-1 rounded"
            >
              <Text className="text-white text-sm">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default InventoryScreen;
