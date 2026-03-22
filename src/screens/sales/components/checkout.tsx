import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

// Internal/Service Imports
import { CartItem } from '../../../../models';
import { printToPrinter } from '../../../services/printerService';
import { getNextReceiptNumber } from '../../../utils/recieptNo';
import { PrinterSelectionModal } from '../../printerSelection';
import { useBusiness } from '../../../context/BusinessContext';
import { useUser } from '../../../context/UserContext';
import { FineDate } from '../../../../utils/formatDate';
import Keypad from './keypad';
import { useTheme } from '../../../context/themeContext';
import Toast from '../../../components/Toast';

/**
 * PROPS INTERFACE
 */
interface CheckoutModalProps {
  modalVisible: boolean;
  clearCart: () => void;
  isDarkMode?: any;
  setMsg?: any;
  msg?: any;
  cartItems: CartItem[];
  PostLocally: (receiptNo: string, method: string, phone: string, amount: number, mpesaData?: any, displayNo?: any) => Promise<void>;
  setModalVisible: (v: boolean) => void;
}

/**
 * REUSABLE STYLED COMPONENTS
 */
const Divider = ({ color }: { color: string }) => (
  <View style={{ height: 1, backgroundColor: color, marginVertical: 12, opacity: 0.3 }} />
);

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  modalVisible,
  cartItems,
  PostLocally,
  clearCart,
  setModalVisible,
}) => {
  // --- CONTEXT & HOOKS ---
  const { user } = useSelector((state: any) => state.auth);
  const { business } = useBusiness();
  const { colors } = useTheme();

  // --- STATE MANAGEMENT ---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA'>('CASH');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountGiven, setAmountGiven] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedPrinterMac, setSelectedPrinterMac] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printCount, setPrintCount] = useState(0);
  const [adjustedCart, setAdjustedCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [msg, setMsg] = useState({ msg: "", state: "" });
  // --- ANIMATIONS ---
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  // --- INITIALIZATION ---
  useEffect(() => {
    if (modalVisible) {
      setAdjustedCart([...cartItems]);
      if (business?.strictMpesa) setPaymentMethod('MPESA');

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
      }).start();
    }
  }, [modalVisible, cartItems]);

  useEffect(() => {
    const loadPrinter = async () => {
      const saved = await AsyncStorage.getItem('SELECTED_PRINTER_MAC');
      if (saved) setSelectedPrinterMac(saved);
      checkPendingReceipts();
    };
    loadPrinter();
  }, []);

  // --- CALCULATIONS ---
  const totals = useMemo(() => {
    const subtotal = adjustedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * (16 / 116); // Assuming 16% VAT Inclusive
    const finalTotal = subtotal - discount;
    return { subtotal, tax, finalTotal };
  }, [adjustedCart, discount]);

  const changeDue = useMemo(() => {
    const cash = parseFloat(amountGiven) || 0;
    return cash > totals.finalTotal ? cash - totals.finalTotal : 0;
  }, [amountGiven, totals.finalTotal]);

  // --- PENDING RECEIPTS LOGIC ---
  const checkPendingReceipts = async () => {
    const data = await AsyncStorage.getItem("PENDING_RECEIPTS");
    const receipts = data ? JSON.parse(data) : [];
    setPrintCount(receipts.length);
    if (selectedPrinterMac && receipts.length > 0) autoRetryPendingReceipts();
  };

  const savePendingReceipt = async (receipt: any) => {
    const existing = await AsyncStorage.getItem("PENDING_RECEIPTS");
    const receipts = existing ? JSON.parse(existing) : [];
    const updated = [...receipts, receipt];
    await AsyncStorage.setItem("PENDING_RECEIPTS", JSON.stringify(updated));
    setPrintCount(updated.length);
  };

  const autoRetryPendingReceipts = async () => {
    if (retrying || !selectedPrinterMac) return;
    setRetrying(true);
    try {
      const data = await AsyncStorage.getItem("PENDING_RECEIPTS");
      const receipts = data ? JSON.parse(data) : [];
      if (!receipts.length) return;

      const remaining = [];
      for (const r of receipts) {
        try {
          await printToPrinter(selectedPrinterMac, r.receiptText, "https://mtandao.app", business?.printQr);
          await PostLocally(r.receiptNo, r.method, r.phone, r.amount);
        } catch {
          remaining.push(r);
        }
      }
      await AsyncStorage.setItem("PENDING_RECEIPTS", JSON.stringify(remaining));
      setPrintCount(remaining.length);
    } finally {
      setRetrying(false);
    }
  };

  // --- MPESA STK PUSH LOGIC ---
  const handleSTK = async (phone: string) => {
    const requestId = `STK-${Date.now()}`;
    try {
      const response = await fetch(`https://5fd3-41-209-9-121.ngrok-free.app/v1/payments/stk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": `${business?.api_key}`,
          "Idempotency-Key": requestId,
        },
        body: JSON.stringify({
          amount: 1,
          phone: `254${phone}`,
          accountReference: business?.business_name?.substring(0, 12),
          description: "Retail Goods"
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "STK Initiation Failed");

      // Polling Logic
      let status = "pending";
      for (let i = 0; i < 15; i++) {
        await new Promise(res => setTimeout(res, 5000));
        const statusCheck = await fetch(`https://5fd3-41-209-9-121.ngrok-free.app/callbacks/stk/status/${requestId}`, {
          headers: { "x-api-key": `${business?.api_key}` }
        });
        const statusData = await statusCheck.json();
        if (statusData.status === "success") return { success: true, mpesa: statusData.mpesa };
        if (statusData.status === "failed") return { success: false, error: "Payment declined" };
      }
      return { success: false, error: "Payment timeout" };
    } catch (error: any) {
      return { success: false, error: error.message || "Network Error" };
    }
  };


  const buildReceiptText = ({
    receiptNo,
    paid,
    invoiceId,
    cartItems,
    user,
    method,
    amountPaid,
    mpesaData,
  }: any) => {
    const width = 32;
    const line = '-'.repeat(width) + '\n';
    const center = (str: string) => {
      const space = Math.max(0, Math.floor((width - str.length) / 2));
      return ' '.repeat(space) + str + '\n';
    };

    let text = '';
    if (business) {
      text += center(business.business_name.toUpperCase());
      text += center(business.postal_address);
      text += center(`Tel: ${business.phone_number}`);
    }
    text += line;

    text += `Receipt No: ${receiptNo}\nInvoice ID: ${invoiceId}\nPayment: ${method}\n`;

    // USE THE PASSED DATA INSTEAD OF STATE
    if (mpesaData?.receiptNumber) {
      text += `Trans ID: ${mpesaData.receiptNumber}\n`;
      text += `Paid via: ${phoneNumber}\n`;
    }
    const displayDate = mpesaData?.transactionDate
      ? FineDate(`${mpesaData.transactionDate}`)
      : new Date().toLocaleString();

    text += `Date: ${displayDate}\n${line}ITEMS\n`;

    let totalInclusive = 0;
    cartItems.forEach((item: any) => {
      const itemTotal = item.price * item.quantity;
      totalInclusive += itemTotal;
      const name = item.product_name.length > width ? item.product_name.substring(0, width) : item.product_name;
      text += `${name}\n`;
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
    text += `TOTAL`.padEnd(width - totals.finalTotal.toFixed(2).length) + totals.finalTotal.toFixed(2) + '\n';
    text += line;

    text += `Amount Paid`.padEnd(width - paid.toFixed(2).length) + paid.toFixed(2) + '\n';
    text += `Change`.padEnd(width - (changeDue).toFixed(2).length) + (changeDue).toFixed(2) + '\n';
    text += line;

    text += center(`MPESA TILL: 123456`);
    text += center('Prices VAT Inclusive');
    text += center('Thank You!');
    if (user?.name) text += `Served by: ${user.name}\n`;

    return text;
  };

  // --- FINAL CHECKOUT ---
  const finalizeCheckout = async () => {
    if (paymentMethod === 'CASH' && (parseFloat(amountGiven) || 0) < totals.finalTotal) {
      setMsg({ msg: `Cash amount is less than total`, state: "error" });
      return;
    }
    if (paymentMethod === 'MPESA' && phoneNumber.length < 9) {
      setMsg({ msg: `Valid Mpesa phone required`, state: "error" });
      return;
    }

    setProcessing(true);
    try {
      let mpesaData = null;
      if (paymentMethod === 'MPESA') {
        const result = await handleSTK(phoneNumber);
        if (!result.success) {
          setMsg({ msg: `Payment Failed\n${result.error}`, state: "error" });

          return;
        }
        mpesaData = result.mpesa;
      }

      const receiptNo = await getNextReceiptNumber();
      const displayNo = receiptNo;
      const paid = paymentMethod === 'CASH' ? parseFloat(amountGiven) : totals.finalTotal;

      const receiptText = buildReceiptText({
        invoiceId: `INV${Date.now().toString().slice(-6)}`,
        receiptNo: displayNo,
        user,
        cartItems: adjustedCart,
        method: paymentMethod,
        paid: paid,
        mpesaData: mpesaData
      });

      // Post locally
      await PostLocally(displayNo, paymentMethod, phoneNumber, paid, mpesaData, receiptNo);

      // Print Logic
      if (selectedPrinterMac) {
        try {
          await printToPrinter(selectedPrinterMac, receiptText, "https://mtandao.app", business?.printQr);
        } catch {
          await savePendingReceipt({ receiptNo: displayNo, method: paymentMethod, phone: phoneNumber, amount: paid, receiptText });
        }
      }

      clearCart();
      setModalVisible(false);
      setMsg({ msg: "transaction Complete...", state: "success" });
    } catch (err) {
      console.log(err)
      setMsg({ msg: "Failed to finalize sale", state: "error" });
    } finally {
      setProcessing(false);
    }
  };

  // --- UI COMPONENTS ---
  const renderItem = ({ item, index }: { item: CartItem, index: number }) => (
    <View style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{item.product_name}</Text>
        <View className="flex-row items-center mt-1">
          <TouchableOpacity
            onPress={() => {
              const updated = [...adjustedCart];
              if (updated[index].quantity > 1) updated[index].quantity -= 1;
              else updated.splice(index, 1);
              setAdjustedCart(updated);
            }}
            className="bg-red-500/20 p-1 rounded"
          >
            <Icon name="minus" size={10} color="#ef4444" />
          </TouchableOpacity>
          <Text style={{ color: colors.subText, marginHorizontal: 10 }}>Qty: {item.quantity}</Text>
          <TouchableOpacity
            onPress={() => {
              const updated = [...adjustedCart];
              updated[index].quantity += 1;
              setAdjustedCart(updated);
            }}
            className="bg-green-500/20 p-1 rounded"
          >
            <Icon name="plus" size={10} color="#22c55e" />
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        keyboardType="numeric"
        value={item.price.toString()}
        onChangeText={(v) => {
          const p = parseFloat(v) || 0;
          const updated = [...adjustedCart];
          updated[index].price = p;
          setAdjustedCart(updated);
        }}
        style={[styles.priceInput, { color: colors.primaryLight, backgroundColor: colors.background }]}
      />
    </View>
  );
  useEffect(() => {
    if (!modalVisible) {
      clearCart();
      setAdjustedCart([]);
      setAmountGiven('');
      setPhoneNumber('');
    }
  }, [modalVisible]);
  return (
    <Modal animationType="slide" transparent={false} visible={modalVisible}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* HEADER */}
          <View className="px-6 py-4 flex-row justify-between items-center border-b" style={{ borderColor: colors.border }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>Checkout</Text>
              <Text style={{ color: colors.subText, fontSize: 12 }}>{adjustedCart.length} items in bucket</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2">
              <Ionicons name="close-circle" size={32} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>

            {/* CART ITEMS SUMMARY */}
            <View className="mb-6">
              <Text className="text-[10px] tracking-widest font-bold mb-3 uppercase" style={{ color: colors.subText }}>Order Summary</Text>
              <FlatList
                data={adjustedCart}
                renderItem={renderItem}
                keyExtractor={(item, idx) => `item-${idx}`}
                scrollEnabled={false}
              />
            </View>

            {/* TOTALS CARD */}
            <View style={[styles.totalsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View className="flex-row justify-between mb-2">
                <Text style={{ color: colors.subText }}>Subtotal</Text>
                <Text style={{ color: colors.text }}>Ksh {totals.subtotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text style={{ color: colors.subText }}>VAT (Included)</Text>
                <Text style={{ color: colors.text }}>Ksh {totals.tax.toFixed(2)}</Text>
              </View>
              <Divider color={colors.border} />
              <View className="flex-row justify-between items-center">
                <Text style={{ color: colors.text, fontWeight: 'bold' }}>Amount Payable</Text>
                <Text style={{ color: colors.primaryLight, fontSize: 24, fontWeight: '900' }}>
                  Ksh {totals.finalTotal.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* PAYMENT METHOD TOGGLE */}
            {!business?.strictMpesa && (
              <View className="flex-row mb-6 bg-slate-800/50 p-1 rounded-xl">
                <TouchableOpacity
                  onPress={() => setPaymentMethod('CASH')}
                  className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${paymentMethod === 'CASH' ? 'bg-blue-600' : ''}`}
                >
                  <Icon name="money-bill-wave" size={14} color="white" />
                  <Text className="text-white font-bold ml-2">CASH</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPaymentMethod('MPESA')}
                  className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${paymentMethod === 'MPESA' ? 'bg-green-600' : ''}`}
                >
                  <Icon name="mobile-alt" size={14} color="white" />
                  <Text className="text-white font-bold ml-2">MPESA</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PAYMENT INPUTS */}
            {paymentMethod === 'MPESA' ? (
              <Animated.View style={{ opacity: 1 }}>
                <Text style={{ color: colors.subText, marginBottom: 8, fontWeight: '600' }}>Mpesa Phone Number</Text>
                <View style={[styles.phoneInputContainer, { backgroundColor: colors.card, borderColor: colors.primaryLight }]}>
                  <Text style={{ color: colors.primaryLight, fontWeight: 'bold', fontSize: 18 }}>+254 </Text>
                  <TextInput
                    placeholder="712345678"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                    maxLength={9}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: 'bold' }}
                  />
                </View>
                <View className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Text className="text-green-500 text-xs text-center font-medium">
                    Customer will receive a popup on their phone to enter PIN.
                  </Text>
                </View>
              </Animated.View>
            ) : (
              <View>
                <Text style={{ color: colors.subText, marginBottom: 8, fontWeight: '600' }}>Amount Received</Text>
                <View className="mb-4 p-4 rounded-xl border-2 items-center" style={{ borderColor: colors.primaryLight, backgroundColor: colors.card }}>
                  <Text style={{ color: colors.text, fontSize: 32, fontWeight: 'bold' }}>
                    Ksh {amountGiven || "0.00"}
                  </Text>
                </View>
                <Keypad value={amountGiven} onChange={setAmountGiven} />

                {changeDue > 0 && (
                  <View className="mt-4 p-4 rounded-xl bg-orange-500/10 flex-row justify-between">
                    <Text className="text-orange-500 font-bold">CHANGE TO GIVE:</Text>
                    <Text className="text-orange-500 font-black text-lg">Ksh {changeDue.toFixed(2)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* PENDING RECEIPTS BUTTON */}
            {printCount > 0 && (
              <TouchableOpacity
                onPress={autoRetryPendingReceipts}
                className="mt-6 flex-row items-center justify-between p-4 rounded-xl bg-amber-500"
              >
                <View className="flex-row items-center">
                  <Icon name="exclamation-triangle" color="white" size={16} />
                  <Text className="text-white font-bold ml-2">Sync Pending Receipts</Text>
                </View>
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white font-black">{printCount}</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* BOTTOM FIXED ACTION BAR */}
          <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>

            {/* PRINTER STATUS */}
            <TouchableOpacity
              onPress={() => setShowPrinterModal(true)}
              style={[styles.printerBtn, { backgroundColor: selectedPrinterMac ? colors.success + '20' : colors.danger + '20' }]}
            >
              <Icon
                name="print"
                size={20}
                color={selectedPrinterMac ? colors.success : colors.danger}
              />
              {!selectedPrinterMac && <View style={styles.alertDot} />}
            </TouchableOpacity>

            {/* MAIN ACTION */}
            <TouchableOpacity
              onPress={finalizeCheckout}
              disabled={processing || (paymentMethod === 'CASH' && !amountGiven)}
              style={[
                styles.mainActionBtn,
                {
                  backgroundColor: processing ? colors.primaryDark : colors.success,
                  opacity: (paymentMethod === 'CASH' && !amountGiven) ? 0.6 : 1
                }
              ]}
            >
              {processing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.mainActionText}>
                  {paymentMethod === 'MPESA' ? 'PROCESS MPESA' : 'COMPLETE SALE'}
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>

        {/* PRINTER MODAL */}
        <PrinterSelectionModal
          visible={showPrinterModal}
          onClose={() => setShowPrinterModal(false)}
          onSelect={(mac) => {
            setSelectedPrinterMac(mac);
            AsyncStorage.setItem('SELECTED_PRINTER_MAC', mac);
            setTimeout(autoRetryPendingReceipts, 500);
          }}
        />

      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  priceInput: {
    width: 80,
    padding: 8,
    borderRadius: 8,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  printerBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: 'white',
  },
  mainActionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  mainActionText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default CheckoutModal;