import { useState } from 'react';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { getNextReceiptNumber } from '../utils/recieptNo';
import { saveReceiptOffline } from '../utils/recieptNo';

const PRINTER_MAC = '02:38:7D:AB:B2:52';

export const usePrinter = () => {
  const [loading, setLoading] = useState(false);

  const printReceipt = async (receiptBuilder: Function, data: any) => {
    try {
      setLoading(true);

      await BLEPrinter.init();
      await BLEPrinter.connectPrinter(PRINTER_MAC);

      const receiptNo = await getNextReceiptNumber();

      const receiptText = receiptBuilder({
        ...data,
        receiptNo,
      });

      // Save locally BEFORE printing
      await saveReceiptOffline({
        ...data,
        receiptNo,
      });

      await BLEPrinter.printText(receiptText);

      // Cut paper
      await BLEPrinter.printText('\x1D\x56\x00');

      await BLEPrinter.closeConn();

    } catch (err) {
      console.log('Printer Error', err);
    } finally {
      setLoading(false);
    }
  };

  return { printReceipt, loading };
};