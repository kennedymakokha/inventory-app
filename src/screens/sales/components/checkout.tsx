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

} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from 'react-redux';
import { CartItem } from '../../../../models';
import { printToPrinter as printToPrinter } from '../../../services/printerService';
import { getNextReceiptNumber } from '../../../utils/recieptNo';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrinterSelectionModal } from '../../printerSelection';
import { useSettings } from '../../../context/SettingsContext';
import { Theme } from '../../../utils/theme';
import { Animated } from 'react-native';

interface CheckoutModalProps {
  modalVisible: boolean;
  isDarkMode?:any
  setMsg?:any
  msg?:any;
  cartItems: CartItem[];
  PostLocally: () => void;
  setModalVisible: (v: boolean) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  modalVisible,
  cartItems,
  msg,
  PostLocally,
  setMsg,
  setModalVisible,
}) => {
  const { user } = useSelector((state: any) => state.auth);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA'>('CASH');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountGiven, setAmountGiven] = useState(''); // Cash input
  const [processing, setProcessing] = useState(false);
  const [selectedPrinterMac, setSelectedPrinterMac] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [adjustedCart, setAdjustedCart] = useState<CartItem[]>([...cartItems]);
  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;
  const { business } = user;

  useEffect(() => {
    // Load saved printer
    const loadPrinter = async () => {
      const saved = await AsyncStorage.getItem('SELECTED_PRINTER_MAC');
      if (saved) setSelectedPrinterMac(saved);
    };
    loadPrinter();
  }, []);

  // Update adjustedCart if cartItems change
  useEffect(() => {
    setAdjustedCart([...cartItems]);
  }, [cartItems]);

  // Grand total based on adjusted prices
  const grandTotal = adjustedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Change calculation
  const changeDue =
    paymentMethod === 'CASH' && parseFloat(amountGiven) > grandTotal
      ? parseFloat(amountGiven) - grandTotal
      : 0;

  // Finalize checkout
  const finalizeCheckout = async (
    method: string,
    paidAmount: number,
    transId?: string | null,
    maskedPhone?: string | null
  ) => {
    if (method === 'CASH' && paidAmount < grandTotal) {
      Alert.alert('Insufficient Cash', 'Amount given is less than the total payable.');
      return;
    }

    const receiptNo = await getNextReceiptNumber();
    const invoiceId = `INV${Date.now().toString().slice(-6)}`;
    const displayReceiptNo = `RCPT${receiptNo}`;

    try {
      setProcessing(true);

      const receiptData = {
        items: adjustedCart,
        receiptNo,
        invoiceId,
        paymentMethod: method,
        transaction_id: transId,
        total: grandTotal,
        timestamp: new Date().toISOString(),
      };

      const buildReceiptText = ({
        receiptNo,
        invoiceId,
        cartItems,
        user,
        paymentMethod,
        amountPaid,
      }: any) => {
        const width = 32;
        const line = '-'.repeat(width) + '\n';
        const center = (str: string) => {
          const space = Math.max(0, Math.floor((width - str.length) / 2));
          return ' '.repeat(space) + str + '\n';
        };

        let text = '';
        text += center(business.business_name.toUpperCase());
        text += center(business.postal_address);
        text += center(`Tel: ${business.phone_number}`);
        text += line;

        const now = new Date();
        text += `Receipt No: ${receiptNo}\nInvoice ID: ${invoiceId}\nPayment: ${paymentMethod}\n`;
        if (transId) text += `Trans ID: ${transId}\n`;
        if (maskedPhone) text += `Paid via: ${maskedPhone}\n`;
        text += `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}\n${line}ITEMS\n`;

        let totalInclusive = 0;
        cartItems.forEach((item: any) => {
          const itemTotal = item.price * item.quantity;
          totalInclusive += itemTotal;
          const name = item.product_name.length > width ? item.product_name.substring(0, width) : item.product_name;
          text += `${name}\n`;
          const left = `${item.quantity} x ${item.price.toFixed(2)}`;
          const right = itemTotal.toFixed(2);
          text += left.padEnd(width - right.length) + right + '\n';
        });

        text += line;
        const vat = totalInclusive * (16 / 116);
        const net = totalInclusive - vat;

        text += `Net (Ex VAT)`.padEnd(width - net.toFixed(2).length) + net.toFixed(2) + '\n';
        text += `VAT (16%)`.padEnd(width - vat.toFixed(2).length) + vat.toFixed(2) + '\n';
        text += line;
        text += `TOTAL`.padEnd(width - grandTotal.toFixed(2).length) + grandTotal.toFixed(2) + '\n';
        text += line;
        text += `Amount Paid`.padEnd(width - amountPaid.toFixed(2).length) + amountPaid.toFixed(2) + '\n';
        text += `Change`.padEnd(width - (amountPaid - grandTotal).toFixed(2).length) + (amountPaid - grandTotal).toFixed(2) + '\n';
        text += line;

        text += center(`MPESA TILL: 123456`);
        text += center('Prices VAT Inclusive');
        text += center('Thank You!');
        if (user?.name) text += `Served by: ${user.name}\n`;

        return text;
      };

      const receiptText = buildReceiptText({
        receiptNo: displayReceiptNo,
        invoiceId,
        cartItems: adjustedCart,
        user,
        paymentMethod: method,
        amountPaid: paidAmount,
      });

      if (selectedPrinterMac) {
        printToPrinter(selectedPrinterMac, receiptText, `https://mtandao.app`).catch((e: any) => {
          Alert.alert('Print Error', 'Transaction saved, but printer is offline.');
        });
      }

      PostLocally(); // Clear cart
      setPhoneNumber('');
      setAmountGiven('');
      setModalVisible(false);
    } catch (err) {
      console.error('Checkout System Error:', err);
      Alert.alert('Database Error', 'Could not save transaction. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
const pulseAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  if (!selectedPrinterMac) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  } else {
    pulseAnim.setValue(1);
  }
}, [selectedPrinterMac]);
  return (
    <Modal animationType="fade" transparent={false} visible={modalVisible}>
      <SafeAreaView className="flex-1 bg-slate-900 pt-20">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 px-6"
        >
          {/* SUMMARY CARD */}
          <View className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 mb-6">
            <View className="flex-row justify-between items-end my-4 px-4 py-6">
              <View>
                <Text className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                  Total Payable
                </Text>
                <Text className="text-green-400 text-4xl font-black">
                  Ksh {grandTotal.toLocaleString()}
                </Text>
              </View>
              <Icon name="file-invoice-dollar" size={30} color="#1e293b" />
            </View>

            <View className="h-[1px] bg-slate-800 w-full my-4" />

            <FlatList
              data={adjustedCart}
              scrollEnabled={true}
              style={{ maxHeight: 150 }}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }: any) => (
                <View className="flex-row justify-between mb-2 px-4 items-center">
                  <Text className="text-slate-400 font-medium">
                    {item.product_name} <Text className="text-slate-600">x{item.quantity}</Text>
                  </Text>
                  <TextInput
                    value={item.price.toString()}
                    keyboardType="numeric"
                    onChangeText={(val) => {
                      const newVal = parseFloat(val) || 0;
                      if (newVal < item.cost_price) {
                        Alert.alert(
                          'Invalid Price',
                          `Price cannot be lower than the cost price (${item.cost_price})`
                        );
                        return;
                      }
                      const updated = [...adjustedCart];
                      updated[index].price = newVal;
                      setAdjustedCart(updated);
                    }}
                    className="text-slate-300 font-bold w-16 text-right"
                  />
                </View>
              )}
            />
          </View>

          {/* PAYMENT SELECTOR */}
          <Text className="text-slate-500 font-black mb-4 uppercase text-[10px] tracking-[2px]">
            Choose Method
          </Text>
          <View className="flex-row w-full items-center justify-center gap-x-3 space-x-3 mb-8">
            <TouchableOpacity
              onPress={() => setPaymentMethod('CASH')}
              className={` w-1/3 py-5 rounded-3xl items-center border-2 ${paymentMethod === 'CASH'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-800 bg-slate-900'
                }`}
            >
              <Icon name="wallet" color={paymentMethod === 'CASH' ? '#22c55e' : '#475569'} size={24} />
              <Text
                className={`mt-2 font-bold ${paymentMethod === 'CASH' ? 'text-white' : 'text-slate-500'
                  }`}
              >
                CASH
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('MPESA')}
              className={`w-1/3 py-5 rounded-3xl items-center border-2 ${paymentMethod === 'MPESA'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-800 bg-slate-900'
                }`}
            >
              <Icon
                name="mobile-alt"
                color={paymentMethod === 'MPESA' ? '#22c55e' : '#475569'}
                size={24}
              />
              <Text
                className={`mt-2 font-bold ${paymentMethod === 'MPESA' ? 'text-white' : 'text-slate-500'
                  }`}
              >
                M-PESA
              </Text>
            </TouchableOpacity>
          </View>

          {/* DYNAMIC INPUT AREA */}
          <View className="flex-1">
            {paymentMethod === 'MPESA' ? (
              <View className="animate-in slide-in-from-bottom">
                <Text className="text-slate-400 font-bold mb-2 ml-1">Customer Phone Number</Text>
                <View className="bg-slate-900 border border-slate-700 rounded-2xl flex-row items-center px-4">
                  <Text className="text-slate-500 font-bold text-lg mr-2">+254</Text>
                  <TextInput
                    placeholder="712345678"
                    placeholderTextColor="#475569"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    className="flex-1 text-white py-4 font-black text-xl"
                  />
                </View>
              </View>
            ) : (
              <View className="animate-in slide-in-from-bottom">
                <Text className="text-slate-400 font-bold mb-2 ml-1">Amount Given (Ksh)</Text>
                <View className="bg-slate-900 border border-slate-700 rounded-2xl flex-row items-center px-4">
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor="#475569"
                    keyboardType="numeric"
                    value={amountGiven}
                    onChangeText={setAmountGiven}
                    className="flex-1 text-white py-4 font-black text-2xl text-center"
                  />
                </View>
                {parseFloat(amountGiven) > 0 && (
                  <View className="mt-4 flex-row justify-between px-2">
                    <Text className="text-slate-500 font-bold">CHANGE DUE:</Text>
                    <Text className="text-green-400 font-black text-lg">
                      Ksh {changeDue.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ACTION BUTTONS */}
          <View className="pb-10 space-y-4">
            <TouchableOpacity
              onPress={() =>
                paymentMethod === 'MPESA'
                  ? finalizeCheckout('MPESA', grandTotal)
                  : finalizeCheckout('CASH', parseFloat(amountGiven))
              }
              disabled={processing || (paymentMethod === 'CASH' && !amountGiven)}
              className={`py-6 rounded-3xl items-center justify-center shadow-xl ${processing || (paymentMethod === 'CASH' && !amountGiven)
                  ? 'bg-slate-700'
                  : 'bg-green-600'
                }`}
            >
              <Text className="text-white font-black text-lg uppercase tracking-widest">
                {processing
                  ? 'Processing...'
                  : paymentMethod === 'MPESA'
                    ? 'Send STK & Print'
                    : 'Confirm & Print Receipt'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              disabled={processing}
              className="py-2 items-center"
            >
              <Text className="text-slate-500 font-bold">Cancel Transaction</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* PRINTER LINK */}

    
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
  <TouchableOpacity
    onPress={() => setShowPrinterModal(true)}
    className={`p-2 rounded flex-row items-center ${
      selectedPrinterMac ? "bg-slate-700" : "bg-red-600"
    }`}
  >
    <Text className="text-white">
      🖨 {selectedPrinterMac ? "Printer Linked" : "No Printer Linked"}
    </Text>
  </TouchableOpacity>
</Animated.View>



      <PrinterSelectionModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onSelect={(mac) => setSelectedPrinterMac(mac)}
      />
    </Modal>
  );
};

export default CheckoutModal;