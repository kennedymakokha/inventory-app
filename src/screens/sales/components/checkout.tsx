import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSettings } from '../../../context/SettingsContext';

import { useBusiness } from '../../../context/BusinessContext';
import { useUser } from '../../../context/UserContext';

import { printToPrinter } from '../../../services/printerService';
import { getNextReceiptNumber } from '../../../utils/recieptNo';
import { PrinterSelectionModal } from '../../printerSelection';

import { CartItem } from '../../../../models';
import { FineDate } from '../../../../utils/formatDate';
import Keypad from './keypad';
import { useTheme } from '../../../context/themeContext';

interface CheckoutModalProps {
  modalVisible: boolean;
  setMsg?: any;
  msg?: any;
  cartItems: CartItem[];
  PostLocally: any;
  setModalVisible: (v: boolean) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  modalVisible,
  cartItems,
  PostLocally,
  setMsg,
  setModalVisible,
}) => {

  const { isDarkMode } = useSettings();
  const { theme } = useTheme();
  const colors = theme[isDarkMode ? 'dark' : 'light'];

  const { business } = useBusiness();
  const { user } = useUser();

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA'>('CASH');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountGiven, setAmountGiven] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedPrinterMac, setSelectedPrinterMac] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printCount, setPrintCount] = useState(0);
  const [adjustedCart, setAdjustedCart] = useState<CartItem[]>([...cartItems]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setAdjustedCart([...cartItems]);
  }, [cartItems]);

  useEffect(() => {
    if (!selectedPrinterMac) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [selectedPrinterMac]);

  const grandTotal = adjustedCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const changeDue =
    paymentMethod === 'CASH' && parseFloat(amountGiven) > grandTotal
      ? parseFloat(amountGiven) - grandTotal
      : 0;

  return (
    <Modal animationType="fade" transparent={false} visible={modalVisible}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingBottom: 120 }}
          >

            {/* SUMMARY */}
            <View style={{
              backgroundColor: colors.card,
              borderColor: colors.border
            }} className="rounded-xl p-6 mb-6 border">

              <Text style={{ color: colors.subText }} className="uppercase text-xs font-bold">
                Total Payable
              </Text>

              <Text style={{ color: theme.success }} className="text-4xl font-black">
                Ksh {grandTotal.toLocaleString()}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

              <FlatList
                data={adjustedCart}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }: any) => (
                  <View className="flex-row justify-between items-center mb-2">
                    <Text style={{ color: colors.subText }}>
                      {item.product_name} x{item.quantity}
                    </Text>

                    <TextInput
                      value={item.price.toString()}
                      keyboardType="numeric"
                      style={{ color: colors.text }}
                      onChangeText={(val) => {
                        const updated = [...adjustedCart];
                        updated[index].price = parseFloat(val) || 0;
                        setAdjustedCart(updated);
                      }}
                    />
                  </View>
                )}
              />
            </View>

            {/* PAYMENT */}
            <View className="flex-row justify-between mb-6">
              {["CASH", "MPESA"].map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() => setPaymentMethod(method as any)}
                  style={{
                    backgroundColor:
                      paymentMethod === method
                        ? theme.success
                        : colors.elevated
                  }}
                  className="w-[48%] py-4 rounded items-center"
                >
                  <Text style={{ color: '#fff' }}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* INPUT */}
            {paymentMethod === "CASH" ? (
              <View>
                <Text style={{ color: colors.subText }}>Amount Given</Text>
                <Text style={{ color: colors.text, fontSize: 32 }}>
                  Ksh {amountGiven || "0"}
                </Text>

                <Keypad value={amountGiven} onChange={setAmountGiven} />

                {parseFloat(amountGiven) > 0 && (
                  <Text style={{ color: theme.success }}>
                    Change: {changeDue}
                  </Text>
                )}
              </View>
            ) : (
              <View>
                <Text style={{ color: colors.subText }}>Phone</Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  style={{
                    color: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                    padding: 10
                  }}
                />
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* BOTTOM BAR */}
      <View style={{
        flexDirection: 'row',
        height: 80,
        backgroundColor: colors.background
      }}>

        <Animated.View style={{
          transform: [{ scale: pulseAnim }],
          backgroundColor: selectedPrinterMac ? colors.elevated : theme.danger,
          width: selectedPrinterMac ? '0%' : '20%',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <TouchableOpacity onPress={() => setShowPrinterModal(true)}>
            <Text style={{ color: '#fff' }}>
              {selectedPrinterMac ? "🖨️" : "No Printer"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: processing
              ? colors.border
              : theme.success
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            CONFIRM
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setModalVisible(false)}
          style={{
            width: '20%',
            backgroundColor: theme.danger,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

      </View>

      <PrinterSelectionModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onSelect={(mac) => setSelectedPrinterMac(mac)}
      />
    </Modal>
  );
};

export default CheckoutModal;