import { View, Text, Alert, Touchable, TouchableOpacity } from 'react-native'
import React from 'react'
import { printReceipt as printToPrinter } from '../services/printerService';
const PrintTest = () => {
    const buildReceiptText = (visitId:string) => {
    const line = '--------------------------------\n';

    let text = '';

    text += `<C> 'CLINIC NAME'}</C>\n`;
    text += `<C>VISIT RECEIPT</C>\n`;
    text += line;

    text += `Date: ${Date().split('T')[0]}\n`;
    text += `ID: ${visitId}\n`;
    text += line;

    text += 'TRIAGE\n';
  

   
   

  
    
    text += `Subtotal`.padEnd(24) + `\n`;
    text += `VAT (16%)`.padEnd(24) + `6\n`;
    text += line;
    text += `<b>${'TOTAL'.padEnd(24)}6</b>\n`;
    text += line;

    text += '<C>Scan QR for visit details</C>\n';

    return text;
  };
  const printReceipt = async (visitId:string) => {
    try {
      const receiptText = buildReceiptText(visitId);

      // Send string directly
      await printToPrinter(receiptText);

      // If you want logo and QR, handle them inside printerService
    } catch (err) {
      Alert.alert('Printer Error', 'Visit saved but receipt could not be printed');
    }
  };
  return (
    <View className="flex-1 items-center justify-center">
        <TouchableOpacity onPress={() => printReceipt('12345')}>
            <Text className="text-white bg-blue-500 px-4 py-2 rounded">Print Test Receipt</Text>
        </TouchableOpacity>
      <Text>PrintTest</Text>
    </View>
  )
}

export default PrintTest