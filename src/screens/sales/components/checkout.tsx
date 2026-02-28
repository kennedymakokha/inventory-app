import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Printer, PrinterConstants } from 'react-native-esc-pos-printer';

import { getNextReceiptNumber, saveReceiptOffline } from '../../../utils/recieptNo';
import { CartItem } from '../../../../models';

interface CheckoutModalProps {
  modalVisible: boolean;
  cartItems: CartItem[];
  PostLocally: () => void;
  setModalVisible: (v: boolean) => void;
}

// 🔥 Direct MAC connection (skip discovery)
const PRINTER_MAC = '02:38:7D:AB:B2:52';

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  modalVisible,
  cartItems,
  PostLocally,
  setModalVisible,
}) => {
  const { user } = useSelector((state: any) => state.auth);
  const { business } = user;

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA'>('CASH');
  const [amountGiven, setAmountGiven] = useState('');
  const [processing, setProcessing] = useState(false);

  const grandTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const changeDue =
    parseFloat(amountGiven || '0') > grandTotal
      ? parseFloat(amountGiven) - grandTotal
      : 0;

  /* =========================
     Build Receipt Text
  ========================== */
  const buildReceiptText = (
    receiptNo: string,
    invoiceId: string,
    paidAmount: number,
    method: string
  ) => {
    const width = 32;
    const line = '--------------------------------\n';
    const now = new Date();
    let text = '';

    text += `<C><B>${business.business_name}</B></C>\n`;
    text += `<C>${business.postal_address}</C>\n`;
    text += `<C>Tel: ${business.phone_number}</C>\n`;
    text += `<C>KRA PIN: ${business.kra_pin}</C>\n`;
    text += line;

    text += `Receipt: ${receiptNo}\n`;
    text += `Invoice: ${invoiceId}\n`;
    text += `Payment: ${method}\n`;
    text += `Date: ${now.toLocaleString()}\n`;
    text += line;

    let totalInclusive = 0;
    cartItems.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      totalInclusive += itemTotal;
      text += `${item.product_name}\n`;
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

    text += `Amount Paid`.padEnd(width - paidAmount.toFixed(2).length) + paidAmount.toFixed(2) + '\n';
    text += `Change`.padEnd(width - changeDue.toFixed(2).length) + changeDue.toFixed(2) + '\n';
    text += line;

    text += `<C>MPESA TILL: 123456</C>\n`;
    text += `<C>Prices VAT Inclusive</C>\n`;
    text += `<C>Thank You & Get Well Soon!</C>\n\n`;

    if (user?.username) {
      text += `Served by: ${user.username}\n`;
    }

    text += '\n\n\n';
    return text;
  };

  /* =========================
     Print via Direct MAC
  ========================== */
  const printReceiptDirect = async (receiptText: string) => {
    try {
      const printer = new Printer({
        target: PRINTER_MAC,
        deviceName: 'p58E', // optional label
      });

      await printer.addQueueTask(async () => {
        await Printer.tryToConnectUntil(
          printer,
          status => status.online.statusCode === PrinterConstants.TRUE
        );

        await printer.addText(receiptText);
        await printer.addFeedLine();
        await printer.addCut();

        await printer.sendData();
        await printer.disconnect();
      });

      console.log('✅ Print successful');
    } catch (error) {
      console.log('❌ Print failed', error);
      Alert.alert(
        'Print Error',
        'Transaction completed but receipt failed to print.'
      );
    }
  };

  /* =========================
     Finalize Checkout
  ========================== */
  const finalizeCheckout = async () => {
    const paidAmount = paymentMethod === 'CASH' ? parseFloat(amountGiven || '0') : grandTotal;

    if (paymentMethod === 'CASH' && paidAmount < grandTotal) {
      Alert.alert('Insufficient Cash', 'Amount given is less than total.');
      return;
    }

    try {
      setProcessing(true);
      const receiptNo = `RCPT${await getNextReceiptNumber()}`;
      const invoiceId = `INV${Date.now().toString().slice(-6)}`;

      const receiptText = buildReceiptText(receiptNo, invoiceId, paidAmount, paymentMethod);

      // 🔥 Direct MAC print
      await printReceiptDirect(receiptText);

      await saveReceiptOffline({
        cartItems,
        receiptNo,
        paymentMethod,
      });

      PostLocally();
      setAmountGiven('');
      setModalVisible(false);
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
     UI
  ========================== */
  return (
    <Modal animationType="fade" transparent={false} visible={modalVisible}>
      <SafeAreaView className="flex-1 bg-slate-900 pt-20">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 px-6"
        >
          <View className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 mb-6">
            <Text className="text-green-400 text-4xl font-black">
              Ksh {grandTotal.toLocaleString()}
            </Text>
          </View>

          {paymentMethod === 'CASH' && (
            <TextInput
              placeholder="Amount Given"
              keyboardType="numeric"
              value={amountGiven}
              onChangeText={setAmountGiven}
              className="bg-slate-800 text-white p-4 rounded-xl mb-4"
            />
          )}

          <TouchableOpacity
            disabled={processing}
            onPress={finalizeCheckout}
            className="bg-green-600 py-5 rounded-3xl items-center"
          >
            <Text className="text-white font-bold text-lg">
              {processing ? 'Processing...' : 'Confirm & Print'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default CheckoutModal;