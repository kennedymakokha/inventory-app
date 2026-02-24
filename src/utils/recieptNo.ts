import AsyncStorage from "@react-native-async-storage/async-storage";

export const getNextReceiptNumber = async () => {
  const key = 'receipt_number';

  const current = await AsyncStorage.getItem(key);
  const next = current ? parseInt(current) + 1 : 1;

  await AsyncStorage.setItem(key, next.toString());

  return next.toString().padStart(5, '0');
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