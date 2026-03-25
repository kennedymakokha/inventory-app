import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import Keypad from './keypad';
import { useTheme } from '../../../context/themeContext';
import Toast from '../../../components/Toast';
import { handleSTK } from './utils/mpesa';
import { buildReceiptText } from './RecieptBuilder';

interface CheckoutModalProps {
  modalVisible: boolean;
  clearCart: () => void;
  cartItems: CartItem[];
  PostLocally: (receiptNo: string, method: string, phone: string, amount: number, mpesaData?: any, displayNo?: any) => Promise<void>;
  setModalVisible: (v: boolean) => void;
}

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
  const { user } = useSelector((state: any) => state.auth);
  const { business } = useBusiness();
  const { colors } = useTheme();

  // --- STATE MANAGEMENT ---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA'>('CASH');
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [activeField, setActiveField] = useState<'PHONE' | 'CASH_AMT' | 'MPESA_AMT'>('CASH_AMT');
  const [retrying, setRetrying] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountGiven, setAmountGiven] = useState(''); // Cash Portion
  const [mpesaPortion, setMpesaPortion] = useState(''); // Mpesa Portion
  const [printCount, setPrintCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [selectedPrinterMac, setSelectedPrinterMac] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [msg, setMsg] = useState({ msg: "", state: "" });
  const hasMpesa = !!business?.api_key; // or wherever API comes from
  const isStrictMpesa = business?.strictMpesa;
  // --- CALCULATIONS ---
  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * (16 / 116);
    return { subtotal, tax, finalTotal: subtotal };
  }, [cartItems]);

  const paymentTotals = useMemo(() => {
    const cash = parseFloat(amountGiven) || 0;
    const mpesa = (isSplitPayment || paymentMethod === 'MPESA') ? (parseFloat(mpesaPortion) || 0) : 0;
    const totalPaid = cash + mpesa;
    const remaining = totals.finalTotal - totalPaid;

    // Change logic: Only applies to the cash portion after Mpesa is deducted
    const effectiveCashNeeded = totals.finalTotal - mpesa;
    const change = (cash > effectiveCashNeeded) ? cash - effectiveCashNeeded : 0;

    return { totalPaid, remaining, change };
  }, [amountGiven, mpesaPortion, totals.finalTotal, isSplitPayment, paymentMethod]);

  // --- KEYPAD INPUT HARMONIZATION ---
  const handleKeypadUpdate = (val: string) => {
    if (activeField === 'PHONE') {
      if (phoneNumber.length < 9) setPhoneNumber(prev => prev + val);
    } else if (activeField === 'MPESA_AMT') {
      setMpesaPortion(prev => prev + val);
    } else {
      setAmountGiven(prev => prev + val);
    }
  };
  useEffect(() => {
    if (isStrictMpesa) {
      setMpesaPortion(totals.finalTotal.toString());
    }
  }, [isStrictMpesa, totals.finalTotal]);
  // --- INITIALIZATION ---
  useEffect(() => {
    if (modalVisible) {
      if (isStrictMpesa) {
        setPaymentMethod('MPESA');
        setIsSplitPayment(false);
        setActiveField('PHONE');
      } else if (!hasMpesa) {
        setPaymentMethod('CASH');
        setIsSplitPayment(false);
        setActiveField('CASH_AMT');
      }
    }
  }, [modalVisible, isStrictMpesa, hasMpesa]);


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
          clearCart();
          setModalVisible(false);
          setAmountGiven("")
          setMpesaPortion("")
          setMsg({ msg: "Transaction Complete", state: "success" });
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
  // --- FINAL CHECKOUT ---
  const finalizeCheckout = async () => {
    const { remaining } = paymentTotals;
    if (remaining > 0.01) {
      setMsg({ msg: `Balance of Ksh ${remaining.toFixed(2)} unpaid`, state: "error" });
      return;
    }
    if (isStrictMpesa) {
      // Force MPESA only
      if (!phoneNumber) {
        setMsg({ msg: "Phone number required for M-Pesa", state: "error" });
        return;
      }
    }

    if (!hasMpesa && paymentMethod === 'MPESA') {
      setMsg({ msg: "M-Pesa not available", state: "error" });
      return;
    }
    setProcessing(true);
    try {
      let mpesaData = null;
      const mpesaToCharge = isSplitPayment
        ? parseFloat(mpesaPortion) || 0
        : paymentMethod === 'MPESA'
          ? totals.finalTotal
          : 0;

      if (mpesaToCharge > 0) {

        const result = await handleSTK(phoneNumber, mpesaToCharge, business); // Pass dynamic amount
        if (!result.success) {
          setMsg({ msg: `Mpesa Failed: ${result.error}`, state: "error" });
          setProcessing(false);
          return;
        }
        mpesaData = result.mpesa;
      }



      const receiptNo = await getNextReceiptNumber();
      const finalMethod = isSplitPayment ? 'SPLIT' : paymentMethod;
      const receiptText = buildReceiptText({
        invoiceId: `INV${Date.now().toString().slice(-6)}`,
        receiptNo,
        user,
        cartItems,
        method: paymentMethod,
        paid: isSplitPayment ? null : parseFloat(amountGiven),
        paidCash: isSplitPayment ? parseFloat(amountGiven) || 0 : null,
        paidMpesa: mpesaToCharge,
        mpesaData: mpesaData,
        totals,
        business,
        phoneNumber, changeDue: paymentTotals.change
      });

      if (selectedPrinterMac) {
        try {

          await printToPrinter(selectedPrinterMac, receiptText, "https://mtandao.app", business?.printQr);
          clearCart();
          setModalVisible(false);
          setAmountGiven("")
          setMpesaPortion("")
          setMsg({ msg: "Transaction Complete", state: "success" });
        } catch {
          await savePendingReceipt({ receiptNo, method: paymentMethod, phone: phoneNumber, amount: amountGiven, receiptText });
        }
      }
      await PostLocally(receiptNo, finalMethod, phoneNumber, totals.finalTotal, mpesaData,
        isSplitPayment ? parseFloat(amountGiven) || 0 : null, mpesaToCharge,);


    } catch (err) {
      console.log("ERROR", err)
      setMsg({ msg: "Failed to finalize sale ", state: "error" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={false} visible={modalVisible}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* HEADER */}
          <View className="px-6 py-4 flex-row justify-between items-center border-b" style={{ borderColor: colors.border }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>Checkout</Text>
              <Text style={{ color: colors.subText, fontSize: 12 }}>Reconcile & Print Receipt</Text>

            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2">
              <Ionicons name="close-circle" size={32} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>

            {/* TOTALS CARD */}
            <View style={[styles.totalsCard, { backgroundColor: colors.card, borderColor: colors.primaryLight }]}>
              <View className="flex-row justify-between items-center">
                <Text style={{ color: colors.text, fontWeight: 'bold' }}>Amount Payable</Text>
                <Text style={{ color: colors.primaryLight, fontSize: 28, fontWeight: '900' }}>
                  Ksh {totals.finalTotal.toLocaleString()}
                </Text>
              </View>
              {paymentTotals.remaining > 0 && (
                <Text className="text-right text-red-500 font-bold mt-1">
                  Pending: Ksh {paymentTotals.remaining.toFixed(2)}
                </Text>
              )}
            </View>

            {/* HYBRID TOGGLE */}
            {hasMpesa && !isStrictMpesa && (
              <TouchableOpacity
                onPress={() => {
                  setIsSplitPayment(!isSplitPayment);
                  setActiveField(!isSplitPayment ? 'PHONE' : 'CASH_AMT');
                }}
                className="flex-row items-center mb-6 p-4 rounded-xl border"
                style={{
                  borderColor: colors.border,
                  backgroundColor: isSplitPayment ? colors.primaryLight + '10' : 'transparent'
                }}
              >
                <Ionicons name={isSplitPayment ? "checkbox" : "square-outline"} size={24} color={colors.primaryLight} />
                <Text style={{ color: colors.text, marginLeft: 10, fontWeight: 'bold' }}>
                  Split Cash & M-Pesa
                </Text>
              </TouchableOpacity>
            )}

            {/* PAYMENT METHOD SELECTOR (Hidden if Split) */}
            {!isSplitPayment && hasMpesa && !isStrictMpesa && (
              <View className="flex-row mb-6 bg-slate-800/50 p-1 rounded-xl">
                <TouchableOpacity
                  onPress={() => { setPaymentMethod('CASH'); setActiveField('CASH_AMT'); }}
                  className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${paymentMethod === 'CASH' ? 'bg-blue-600' : ''}`}
                >
                  <Icon name="money-bill-wave" size={14} color="white" />
                  <Text className="text-white font-bold ml-2">CASH</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPaymentMethod('MPESA'); setActiveField('PHONE');
                    setMpesaPortion(totals.finalTotal.toString());
                    setAmountGiven("");
                  }}
                  className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${paymentMethod === 'MPESA' ? 'bg-green-600' : ''}`}
                >
                  <Icon name="mobile-alt" size={14} color="white" />
                  <Text className="text-white font-bold ml-2">MPESA</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* DYNAMIC INPUTS SECTION */}
            <View className="space-y-4">

              {/* MPESA INPUTS */}
              {hasMpesa && (paymentMethod === 'MPESA' || isSplitPayment || isStrictMpesa) && (
                <View className="mb-4">
                  <Text style={{ color: colors.subText, marginBottom: 8, fontWeight: '600' }}>M-Pesa Details</Text>

                  {/* Phone Number Input (Original Design) */}
                  <TouchableOpacity
                    onPress={() => setActiveField('PHONE')}
                    style={[styles.inputContainer, { borderColor: activeField === 'PHONE' ? colors.primaryLight : colors.border }]}
                  >
                    <Text style={{ color: colors.primaryLight, fontWeight: 'bold', fontSize: 18 }}>+254 </Text>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
                      {phoneNumber || ""}
                    </Text>
                  </TouchableOpacity>

                  {/* Mpesa Amount (Only if Split) */}
                  {isSplitPayment && (
                    <TouchableOpacity
                      onPress={() => setActiveField('MPESA_AMT')}
                      className="mt-3 p-4 rounded-xl border-2"
                      style={{ borderColor: activeField === 'MPESA_AMT' ? colors.primaryLight : colors.border, backgroundColor: colors.card }}
                    >
                      <Text style={{ color: colors.subText, fontSize: 11 }}>M-Pesa Amount</Text>
                      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>Ksh {mpesaPortion || "0.00"}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
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
              {/* CASH INPUT */}
              {!isStrictMpesa && (paymentMethod === 'CASH' || isSplitPayment || !hasMpesa) && (
                <View>
                  <Text style={{ color: colors.subText, marginBottom: 8, fontWeight: '600' }}>Cash Received</Text>
                  <TouchableOpacity
                    onPress={() => setActiveField('CASH_AMT')}
                    className="p-4 rounded-xl border-2"
                    style={{ borderColor: activeField === 'CASH_AMT' ? colors.primaryLight : colors.border, backgroundColor: colors.card }}
                  >
                    <Text style={{ color: colors.subText, fontSize: 11 }}>{isSplitPayment ? "Cash Portion" : "Amount Paid"}</Text>
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>Ksh {amountGiven || "0.00"}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* HARMONIZED KEYPAD */}
            <View className="mt-6">
              <Keypad
                value={activeField === 'PHONE' ? phoneNumber : (activeField === 'MPESA_AMT' ? mpesaPortion : amountGiven)}
                onChange={(v: any) => {
                  if (activeField === 'PHONE') setPhoneNumber(v);
                  else if (activeField === 'MPESA_AMT') setMpesaPortion(v);
                  else setAmountGiven(v);
                }}
              />
            </View>

            {paymentTotals.change > 0 && (
              <View className="mt-4 p-4 rounded-xl bg-orange-500/10 flex-row justify-between">
                <Text className="text-orange-500 font-bold">CHANGE TO GIVE:</Text>
                <Text className="text-orange-500 font-black text-lg">Ksh {paymentTotals.change.toFixed(2)}</Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
          <PrinterSelectionModal
            visible={showPrinterModal}
            onClose={() => setShowPrinterModal(false)}
            onSelect={(mac) => {
              setSelectedPrinterMac(mac);
              AsyncStorage.setItem('SELECTED_PRINTER_MAC', mac);
              setTimeout(autoRetryPendingReceipts, 500);
            }}
          />
          {/* BOTTOM FIXED ACTION BAR */}
          <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
            <TouchableOpacity
              onPress={finalizeCheckout}
              disabled={processing}
              style={[styles.mainActionBtn, { backgroundColor: processing ? colors.primaryDark : colors.success }]}
            >
              {processing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.mainActionText}>COMPLETE TRANSACTION</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  totalsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
  },
  printerBtn: {
    width: "15%",
    height: 50,
    borderRadius: 5,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1e293b', // Matches your card/dark theme
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
  },
  mainActionBtn: {
    height: 50,
    borderRadius: 5,
    width: "80%",
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  mainActionText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.2,
  },
});

export default CheckoutModal;