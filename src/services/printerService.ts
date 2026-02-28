import { Printer } from 'react-native-esc-pos-printer';

export const PRINTER_MAC = 'BT:02:38:7D:AB:B2:52';

export const printReceipt = async (text: string) => {
  try {
    const printer = new Printer({
      target: PRINTER_MAC,
      deviceName: 'P58E',
      // On some Android versions, you MUST remove the colons or add 'BT:' 
      // depends on the underlying driver. Try raw first.
    });

    await printer.addQueueTask(async () => {
      // 1. Connect
      await printer.connect();
      
      // 2. STABILITY DELAY (The Secret Sauce)
      // Many older printers need a moment to breathe after the socket opens
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Print
      await printer.addText(text);
      await printer.addFeedLine(3); // Feed for the tear-off
      
      await printer.sendData();
      await printer.disconnect();
    });

    console.log('✅ Print success');
  } catch (err) {
    console.error('❌ Printer error:', err);
    throw err;
  }
};