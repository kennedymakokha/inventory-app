import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { authorizedFetch } from '../middleware/auth.middleware';
import { Product } from '../../types';
import AddProductModal from './components/addProductModal';
import Button from '../components/Button';
import { fullSync } from '../util/fullSync';
import { getUnsyncedProducts } from '../../localStorage';




const ProductScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setMessage('');
    try {
      await fullSync();
      setMessage('✅ Sync successful!');
    } catch (err) {
      setMessage('❌ Sync failed.');
    } finally {
      setLoading(false);
    }
  };
  const [item, setItem] = useState({
    description: "",
    product_name: "", price: 0,
  });



  const fetchProducts = async () => {
    try {
      const res = await authorizedFetch('https://6d41-41-139-236-221.ngrok-free.app/api/products');
      setProducts(res.products);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch products');
    }
  };



  const deleteProduct = async (id: string) => {
    try {
      await axios.delete(`http://<YOUR_SERVER>/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete product');
    }
  };
  useEffect(() => {
    // fetchProducts()
  }, [])
  useEffect(() => {
    const fetchdata = async () => {
      let data = await getUnsyncedProducts(); // Call fetchUsers on mount
      console.log(data)
    }
    fetchdata()
  }, []);
  return (
    <View className="flex-1 p-5 bg-primary-500">
      <View style={{ margin: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <Button title="Sync Now" loading={loading} handleclick={handleSync} />
        )}
        {!!message && <Text style={{ marginTop: 10 }}>{message}</Text>}
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id || item.product_name}
        renderItem={({ item }) => (
          <View className="flex-row justify-between items-center border-b border-gray-300 py-3">
            <Text className="text-base">{item.product_name} - ${item.price}</Text>
            <TouchableOpacity
              onPress={() => deleteProduct(item._id!)}
              className="bg-red-500 px-3 py-1 rounded">
              <Text className="text-white text-sm">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <AddProductModal modalVisible={modalVisible} setItem={setItem} fetchProducts={fetchProducts} item={item} setModalVisible={setModalVisible} />
    </View>
  );
};

export default ProductScreen;
