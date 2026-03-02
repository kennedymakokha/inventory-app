import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, Modal, 
  ActivityIndicator, Alert, Button 
} from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrinterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mac: string) => void;
}

export const PrinterSelectionModal = ({ visible, onClose, onSelect }: PrinterModalProps) => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const scanDevices = async () => {
    setLoading(true);
    try {
      // 1. Get already paired devices (Instant)
      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired);

      // 2. Start discovery for new devices (Takes ~10-15 seconds)
      const unpaired = await RNBluetoothClassic.startDiscovery();
      
      // Combine and remove duplicates by address
      const all = [...paired, ...unpaired];
      const unique = all.filter((v, i, a) => a.findIndex(t => t.address === v.address) === i);
      
      setDevices(unique);
    } catch (err) {
      Alert.alert("Scan Error", "Check if Bluetooth and Location are ON.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) scanDevices();
  }, [visible]);

  const handleSelect = async (device: BluetoothDevice) => {
    await AsyncStorage.setItem('SELECTED_PRINTER_MAC', device.address);
    onSelect(device.address);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-slate-900 p-6 rounded-t-3xl h-3/4">
          <Text className="text-white text-xl font-bold mb-4">Select Printer</Text>
          
          {loading && <ActivityIndicator color="#3b82f6" className="mb-4" />}

          <FlatList
            data={devices}
            keyExtractor={(item) => item.address}
            ListEmptyComponent={<Text className="text-slate-400 text-center mt-10">No printers found...</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => handleSelect(item)}
                className="bg-slate-800 p-4 rounded-xl mb-3 border border-slate-700"
              >
                <Text className="text-white font-semibold">{item.name || 'Unknown Device'}</Text>
                <Text className="text-slate-500 text-xs">{item.address}</Text>
              </TouchableOpacity>
            )}
          />

          <View className="flex-row justify-between mt-4">
            <Button title="Cancel" color="#ef4444" onPress={onClose} />
            <Button title="Refresh" onPress={scanDevices} />
          </View>
        </View>
      </View>
    </Modal>
  );
};