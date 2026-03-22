import AsyncStorage from "@react-native-async-storage/async-storage";


const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 5);
  return `${timestamp}-${randomStr}`.toUpperCase();
};
export const getNextReceiptNumber = async () => {
  const key = 'receipt_number';

  const current = await AsyncStorage.getItem(key);
  const next = current ? parseInt(current) + 1 : 1;

  await AsyncStorage.setItem(key, next.toString());
  let number = `${generateUniqueId()}-${next.toString().padStart(5, '0')}`
  return number;
};


export const saveReceiptOffline = async (receiptData: any) => {
  const existing = await AsyncStorage.getItem('offline_receipts');
  const receipts = existing ? JSON.parse(existing) : [];

  receipts.push({
    ...receiptData,
    synced: false,
    createdAt: new Date().toISOString(),
  });

  await AsyncStorage.setItem(
    'offline_receipts',
    JSON.stringify(receipts)
  );
};