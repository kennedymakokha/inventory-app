import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';

export const PRINTER_MAC = '02:38:7D:AB:B2:52';

let initialized = false;

export const initPrinter = async () => {
  if (initialized) return;

  await BLEPrinter.init();
  initialized = true;
  console.log('🖨 Printer initialized');
};

export const printReceipt = async (text:string) => {
  try {
    await BLEPrinter.connectPrinter(PRINTER_MAC);
    BLEPrinter.printText(text);
    BLEPrinter.printText('\n\n\n');
    console.log('✅ Print success');
  } catch (err) {
    console.log('❌ Printer error', err);
    throw err;
  }
};
