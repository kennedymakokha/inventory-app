import React from 'react';
import { View, Text, Modal, FlatList, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import Button from '../../../components/Button';
import { CartItem } from '../../../../models';
import { printReceipt as printToPrinter } from '../../../services/printerService';
import { getNextReceiptNumber, saveReceiptOffline } from '../../../utils/recieptNo';

interface CheckoutModalProps {
  modalVisible: boolean;
  cartItems: CartItem[];
  PostLocally: () => void;
  setModalVisible: (v: boolean) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  modalVisible,
  cartItems,
  PostLocally,
  setModalVisible,
}) => {
  const { user } = useSelector((state: any) => state.auth);

  const calculateSubtotal = (item: CartItem) => item.price * item.quantity;
  const grandTotal = cartItems.reduce((sum, item) => sum + calculateSubtotal(item), 0);

  const buildReceiptText = ({ receiptNo, invoiceId, cartItems, user, paymentMethod, amountPaid }: any) => {
    const width = 32;
    const line = "--------------------------------\n";
    let text = `<C>CLIDE PHARMACEUTICALS</C>\n<C>P.O BOX 123 - NAIROBI</C>\n<C>Tel: 0712 345 678</C>\n<C>KRA PIN: P051234567X</C>\n${line}`;

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    text += `Receipt No: ${receiptNo}\nInvoice ID: ${invoiceId}\nDate: ${date} ${time}\n${line}`;
    text += `ITEMS\n`;

    let totalInclusive = 0;

    cartItems.forEach((item:any) => {
      const itemTotal = item.quantity * item.price;
      totalInclusive += itemTotal;
      const name = item.product_name.length > width ? item.product_name.substring(0, width) : item.product_name;
      text += `${name}\n`;
      const left = `${item.quantity} x ${item.price.toFixed(2)}`;
      const right = itemTotal.toFixed(2);
      text += left.padEnd(width - right.length) + right + "\n";
    });

    text += line;

    const vat = totalInclusive * (16 / 116);
    const net = totalInclusive - vat;

    text += `Net (Ex VAT)`.padEnd(width - net.toFixed(2).length) + net.toFixed(2) + "\n";
    text += `VAT (16%)`.padEnd(width - vat.toFixed(2).length) + vat.toFixed(2) + "\n";
    text += line;
    text += `TOTAL`.padEnd(width - totalInclusive.toFixed(2).length) + totalInclusive.toFixed(2) + "\n";
    text += line;

    const change = amountPaid - totalInclusive;
    text += `Payment: ${paymentMethod}\n`;
    text += `Amount Paid`.padEnd(width - amountPaid.toFixed(2).length) + amountPaid.toFixed(2) + "\n";
    text += `Change`.padEnd(width - change.toFixed(2).length) + change.toFixed(2) + "\n";
    text += line;

    if (user?.name) text += `Served by: ${user.name}\n`;
    text += `<C>MPESA TILL: 123456</C>\n<C>Prices VAT Inclusive</C>\n<C>Thank You & Get Well Soon!</C>\n\n`;
    return text;
  };

  const printReceipt = async () => {
    try {
      const receiptNo = await getNextReceiptNumber();
      await printToPrinter(buildReceiptText({
        receiptNo: `RCPT${receiptNo}`,
        invoiceId: "INV123456",
        cartItems,
        user,
        paymentMethod: "CASH",
        amountPaid: grandTotal,
      }));
      await saveReceiptOffline({ ...cartItems, receiptNo });
      PostLocally();
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Printer Error', 'Visit saved but receipt could not be printed');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 bg-gray-900 px-4 pt-8">
        <View className="bg-gray-800 rounded-2xl p-4 flex-1 shadow-lg">
          <Text className="text-2xl font-extrabold text-green-400 mb-4">🛒 Checkout</Text>

          {/* Cart Items */}
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row justify-between py-2 border-b border-gray-700">
                <Text className="text-gray-200">{item.product_name} x {item.quantity}</Text>
                <Text className="text-gray-200 font-semibold">Ksh {calculateSubtotal(item).toFixed(2)}</Text>
              </View>
            )}
          />

          {/* Totals */}
          <View className="mt-4 border-t border-gray-700 pt-3">
            <Text className="text-right text-xl font-bold text-green-400">
              Grand Total: Ksh {grandTotal.toFixed(2)}
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-between mt-6">
            <Button handleclick={() => setModalVisible(false)} outline loading={false} title="Cancel" />
            <Button handleclick={printReceipt} loading={false} title="Checkout" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CheckoutModal;