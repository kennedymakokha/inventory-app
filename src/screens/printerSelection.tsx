import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/themeContext';


interface PrinterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mac: string) => void;
}

export const PrinterSelectionModal = ({
  visible,
  onClose,
  onSelect,
}: PrinterModalProps) => {
  const { colors } = useTheme();

  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const scanDevices = async () => {
    setLoading(true);
    try {
      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired);

      const unpaired = await RNBluetoothClassic.startDiscovery();

      const all = [...paired, ...unpaired];
      const unique = all.filter(
        (v, i, a) => a.findIndex((t) => t.address === v.address) === i
      );

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
      {/* BACKDROP */}
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        {/* MODAL CARD */}
        <View
          style={{
            backgroundColor: colors.card,
            padding: 20,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: '75%',
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 16,
            }}
          >
            Select Printer
          </Text>

          {loading && (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginBottom: 16 }}
            />
          )}

          <FlatList
            data={devices}
            keyExtractor={(item) => item.address}
            ListEmptyComponent={
              <Text
                style={{
                  color: colors.subText,
                  textAlign: 'center',
                  marginTop: 40,
                }}
              >
                No printers found...
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={{
                  backgroundColor: colors.elevated,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: '600',
                  }}
                >
                  {item.name || 'Unknown Device'}
                </Text>

                <Text
                  style={{
                    color: colors.subText,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {item.address}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* ACTION BUTTONS */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 16,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.danger,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={scanDevices}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};