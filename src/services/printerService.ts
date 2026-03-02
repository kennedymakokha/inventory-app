import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { Buffer } from 'buffer';

/**
 * logoBase64 must be a MONOCHROME PNG converted to ESC/POS raster bytes.
 * If you only have a normal base64 image, see note below.
 */
export const printToPrinter = async (
  macAddress: string,
  text: string,
  qrData: string,
  logoBase64?: string // pass optional logo
) => {
  if (!macAddress) throw new Error("No printer selected");

  try {
    const isConnected = await RNBluetoothClassic.isDeviceConnected(macAddress);

    let device = isConnected
      ? await RNBluetoothClassic.getConnectedDevice(macAddress)
      : await RNBluetoothClassic.connectToDevice(macAddress);

    // -----------------------------
    // ESC/POS COMMANDS
    // -----------------------------
    const init = '\x1B\x40';
    const leftAlign = '\x1B\x61\x00';
    const centerAlign = '\x1B\x61\x01';
    const feed = '\n\n';

    // Full cut (paper cut)
    const fullCut = '\x1D\x56\x00';

    // -----------------------------
    // QR CODE (ESC/POS)
    // -----------------------------
    const qrModel = '\x1D\x28\x6B\x04\x00\x31\x41\x32\x00';
    const qrSize = '\x1D\x28\x6B\x03\x00\x31\x43\x08'; // size 6 (better visibility)
    const qrError = '\x1D\x28\x6B\x03\x00\x31\x45\x30';

    const qrStoreLen = qrData.length + 3;
    const pL = qrStoreLen % 256;
    const pH = Math.floor(qrStoreLen / 256);

    const qrStore =
      '\x1D\x28\x6B' +
      String.fromCharCode(pL) +
      String.fromCharCode(pH) +
      '\x31\x50\x30' +
      qrData;

    const qrPrint = '\x1D\x28\x6B\x03\x00\x31\x51\x30';

    // -----------------------------
    // LOGO (RASTER IMAGE)
    // -----------------------------
    let logoSection = '';

    if (logoBase64) {
      // IMPORTANT:
      // logoBase64 must already be converted to ESC/POS raster bytes.
      // If it's just a normal image base64, printer will not understand it.
      const logoBuffer = Buffer.from(logoBase64, 'base64');
      logoSection = centerAlign + logoBuffer.toString('binary') + '\n';
    }

    // -----------------------------
    // FULL PAYLOAD
    // -----------------------------
    const fullPayload =
      init +
      logoSection +          // 🖼 logo first
      leftAlign +
      text +
      feed +
      centerAlign +
      qrModel +
      qrSize +
      qrError +
      qrStore +
      qrPrint +
      '\n\n\n' +
      fullCut;               // ✂️ cut paper

    const base64Payload = Buffer.from(fullPayload, 'binary').toString('base64');

    await device.write(base64Payload, 'base64');

    return true;
  } catch (err) {
    console.error("Printer Hardware Error:", err);
    throw err;
  }
};