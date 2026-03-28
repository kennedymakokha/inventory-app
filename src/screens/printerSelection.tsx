import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/themeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
      // Get already paired devices first for speed
      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired);

      // Look for new devices
      const unpaired = await RNBluetoothClassic.startDiscovery();

      const all = [...paired, ...unpaired];
      const unique = all.filter(
        (v, i, a) => a.findIndex((t) => t.address === v.address) === i
      );

      setDevices(unique);
    } catch (err) {
      Alert.alert("Connection Error", "Please ensure Bluetooth and Location services are enabled.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) scanDevices();
    return () => {
      if (visible) RNBluetoothClassic.cancelDiscovery();
    };
  }, [visible]);


  const handleSelect = async (device: BluetoothDevice) => {
    await AsyncStorage.setItem('SELECTED_PRINTER_MAC', device.address);
    onSelect(device.address);
    onClose();
  };
  // const handleSelect = async (device: BluetoothDevice) => {
  //   try {
  //     setLoading(true);
  //     // Ensure device is bonded before selecting (optional but recommended for printers)
  //     const bonded: boolean = await device.isBonded();
  //     if (!bonded) {
  //       await RNBluetoothClassic.pairDevice(device.address);
  //     }

  //     await AsyncStorage.setItem('SELECTED_PRINTER_MAC', device.address);
  //     onSelect(device.address);
  //     onClose();
  //   } catch (error) {
  //     Alert.alert("Pairing Failed", "Could not connect to the printer. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => (
    <TouchableOpacity
      onPress={() => handleSelect(item)}
      style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="print-outline" size={22} color={colors.primary} />
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.deviceName, { color: colors.text }]}>
          {item.name || 'Unknown Printer'}
        </Text>
        <Text style={[styles.deviceAddress, { color: colors.subText }]}>
          {item.address}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />

        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* DRAG HANDLE */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Available Printers</Text>
              <Text style={{ color: colors.subText, fontSize: 13 }}>Select a bluetooth thermal printer</Text>
            </View>
            {loading && <ActivityIndicator color={colors.primary} />}
          </View>

          <FlatList
            data={devices}
            keyExtractor={(item) => item.address}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="bluetooth-outline" size={48} color={colors.border} />
                  <Text style={{ color: colors.subText, marginTop: 12 }}>No devices found</Text>
                </View>
              ) : null
            }
            renderItem={renderDeviceItem}
          />

          {/* ACTION BAR */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.btn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={scanDevices}
              disabled={loading}
              style={[styles.btn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontWeight: '700' }}>Rescan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    height: '70%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  deviceAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});