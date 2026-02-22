import { View, Text, Modal, TextInput, Dimensions, Alert } from 'react-native'
import React, { useState } from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import { authorizedFetch } from '../../../middleware/auth.middleware';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { CartItem, ProductItem } from '../../../../models';
import { FlatList } from 'react-native';
import { printReceipt as printToPrinter } from '../../../services/printerService';
import { useSelector } from 'react-redux';

const CheckoutModal = ({ modalVisible, cartItems, PostLocally, setModalVisible }: any) => {
 const { user } = useSelector((state: any) => state.auth)
    const calculateSubtotal = (item: CartItem) => item.price * item.quantity;
    const grandTotal = cartItems.reduce((sum: any, item: any) => sum + calculateSubtotal(item), 0);
const buildReceiptText = ({
  receiptNo,
  invoiceId,
  cartItems,
  user,
  paymentMethod, // "CASH" | "MPESA"
  amountPaid,
}: {
  receiptNo: string;
  invoiceId: string;
  cartItems: any[];
  user?: any;
  paymentMethod: "CASH" | "MPESA";
  amountPaid: number;
}) => {
  const width = 32;
  const line = "--------------------------------\n";

  let text = "";

  // Header
  text += `<C><b>CLIDE PHARMACEUTICALS</b></C>\n`;
  text += `<C>P.O BOX 123 - NAIROBI</C>\n`;
  text += `<C>Tel: 0712 345 678</C>\n`;
  text += `<C>KRA PIN: P051234567X</C>\n`;
  text += line;

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];

  text += `Receipt No: ${receiptNo}\n`;
  text += `Invoice ID: ${invoiceId}\n`;
  text += `Date: ${date} ${time}\n`;
  text += line;

  text += `<b>ITEMS</b>\n`;

  let totalInclusive = 0;

  cartItems.forEach((item) => {
    const itemTotal = item.quantity * item.price;
    totalInclusive += itemTotal;

    const name =
      item.product_name.length > width
        ? item.product_name.substring(0, width)
        : item.product_name;

    text += `${name}\n`;

    const left = `${item.quantity} x ${item.price.toFixed(2)}`;
    const right = itemTotal.toFixed(2);

    text += left.padEnd(width - right.length) + right + "\n";
  });

  text += line;

  // VAT Inclusive 16%
  const vat = totalInclusive * (16 / 116);
  const net = totalInclusive - vat;

  text += `Net (Ex VAT)`
    .padEnd(width - net.toFixed(2).length) + net.toFixed(2) + "\n";

  text += `VAT (16%)`
    .padEnd(width - vat.toFixed(2).length) + vat.toFixed(2) + "\n";

  text += line;

  text += `<b>TOTAL`
    .padEnd(width - totalInclusive.toFixed(2).length)
    + totalInclusive.toFixed(2) + `</b>\n`;

  text += line;

  // Payment Section
  const change = amountPaid - totalInclusive;

  text += `Payment: ${paymentMethod}\n`;

  text += `Amount Paid`
    .padEnd(width - amountPaid.toFixed(2).length)
    + amountPaid.toFixed(2) + "\n";

  text += `Change`
    .padEnd(width - change.toFixed(2).length)
    + change.toFixed(2) + "\n";

  text += line;

  if (user?.name) {
    text += `Served by: ${user.name}\n`;
  }

  text += `<C>MPESA TILL: 123456</C>\n`;
  text += `<C>Prices VAT Inclusive</C>\n`;
  text += `<C>Thank You & Get Well Soon!</C>\n\n`;

  return text;
};
  const printReceipt = async (visitId:string,cartItems:any[]) => {
    try {
   
      // Send string directly
      await printToPrinter(buildReceiptText({
  receiptNo:"   REC123456",
  invoiceId:"   INV123456",
  cartItems,
  user,
  paymentMethod:"CASH", // "CASH" | "MPESA"
  amountPaid:grandTotal,
}));
   

      // If you want logo and QR, handle them inside printerService
    } catch (err) {
      Alert.alert('Printer Error', 'Visit saved but receipt could not be printed');
    }
  };
    return (

        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(!modalVisible);
            }}>
            <View className="flex-1 px-2 bg-slate-900">
                <View className="bg-green-100 dark:bg-slate-800 p-4 min-h-3/4 mt-20 h-3/4 rounded-lg shadow-md">
                    <Text className="text-xl font-bold mb-3 text-slate-900 dark:text-white">🛒 Checkout</Text>

                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-slate-800 dark:text-slate-200">
                                    {item.product_name} x {item.quantity}
                                </Text>
                                <Text className="text-slate-800 dark:text-slate-200">
                                    Ksh {calculateSubtotal(item).toFixed(2)}
                                </Text>
                            </View>
                        )}
                    />

                    <View className="border-t dark:border-gray-300 border-gray-600 mt-3 pt-3">
                        <Text className="text-lg font-semibold text-right text-slate-900 dark:text-white">
                            Grand Total: Ksh {grandTotal.toFixed(2)}
                        </Text>
                    </View>

                    {/* Checkout Button */}
                    <View className='w-full flex-row '>
                        <View className="mt-2 w-1/2 px-2 ">
                            <Button handleclick={() => setModalVisible(false)} outline loading={false} title="Cancel" />
                        </View>
                        <View className="mt-2 w-1/2 px-2">
                            <Button handleclick={() =>{ printReceipt("1245", cartItems);PostLocally()}} loading={false} title="CheckOut" />

                            {/* Cancel Button */}
                        </View>

                    </View>

                </View>
            </View>
        </Modal>


    )
}

export default CheckoutModal