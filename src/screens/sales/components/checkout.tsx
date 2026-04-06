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
  FlatList,
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
import { buildDeliveryText, buildReceiptText } from './RecieptBuilder';
import DeliveryDetailsModal, { DeliveryDetails } from './deliveryModal';

interface CheckoutModalProps {
  modalVisible: boolean;
  clearCart: () => void;
  setMsg: (msg: { msg: string; state: "success" | "error" }) => void;
  msg: { msg: string; state: "success" | "error" };
  cartItems: CartItem[];
  PostLocally: (receiptNo: string, method: string, phone: string, amount: number, mpesaData?: any, displayNo?: any, cashPaid?: number, mpesaPaid?: number, customerPin?: string) => Promise<void>;
  setModalVisible: (v: boolean) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  modalVisible,
  cartItems,
  PostLocally,
  clearCart,
  setModalVisible,
}) => {
  const { user } = useSelector((state: any) => state.auth);
  const { business: businessData } = user;
  const { business } = useBusiness();
  const { colors } = useTheme();

  // --- STATE MANAGEMENT ---
  const [showItemsList, setShowItemsList] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [customerPin, setCustomerPin] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA'>('CASH');
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [activeField, setActiveField] = useState<'PHONE' | 'CASH_AMT' | 'MPESA_AMT' | 'PIN'>('CASH_AMT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountGiven, setAmountGiven] = useState('');
  const [mpesaPortion, setMpesaPortion] = useState('');
  const [printCount, setPrintCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [selectedPrinterMac, setSelectedPrinterMac] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [msg, setMsg] = useState({ msg: "", state: "" });

  const hasMpesa = !!business?.api_key || !!businessData?.api_key;
  const isStrictMpesa = business?.strictMpesa || businessData?.strictMpesa;

  // --- DELIVERY STATE ---
  const [isDeliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [details, setDetails] = useState<DeliveryDetails>({
    customerName: '',
    phoneNumber: '',
    address: '',
    isExpress: false,
    notes: '',
    deliveryFee: 100, // Ensure your DeliveryDetails interface supports this
  });

  const handleDeliveryConfirm = (confirmedDetails: any) => {
    setDetails(confirmedDetails);
    setDelivering(true);
    setDeliveryModalVisible(false);
  };

  // --- CALCULATIONS ---
  const totals = useMemo(() => {
    const baseSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const hasPin = customerPin.trim().length > 0;

    // Add Delivery Fee if delivering is active
    const deliveryCharge = delivering ? (Number(details.deliveryFee) || 0) : 0;

    const tax = hasPin ? (baseSubtotal * 0.16) : 0;
    const finalTotal = baseSubtotal + tax + deliveryCharge;

    return { subtotal: baseSubtotal, tax, deliveryCharge, finalTotal, hasPin };
  }, [cartItems, customerPin, delivering, details.deliveryFee]);

  const paymentTotals = useMemo(() => {
    const cash = parseFloat(amountGiven) || 0;
    const mpesa = (isSplitPayment || paymentMethod === 'MPESA' || isStrictMpesa)
      ? (parseFloat(mpesaPortion) || 0)
      : 0;

    const totalPaid = cash + mpesa;
    const remaining = totals.finalTotal - totalPaid;
    const netNeededAfterMpesa = Math.max(0, totals.finalTotal - mpesa);
    const change = (cash > netNeededAfterMpesa) ? cash - netNeededAfterMpesa : 0;

    return { totalPaid, remaining, change };
  }, [amountGiven, mpesaPortion, totals.finalTotal, isSplitPayment, paymentMethod, isStrictMpesa]);

  const handleKeypadChange = (v: string) => {
    if (activeField === 'PHONE') setPhoneNumber(v);
    else if (activeField === 'PIN') setCustomerPin(v);
    else if (activeField === 'MPESA_AMT') setMpesaPortion(v);
    else setAmountGiven(v);
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadPrinter = async () => {
      const savedMac = await AsyncStorage.getItem('SELECTED_PRINTER_MAC');
      if (savedMac) setSelectedPrinterMac(savedMac);
      checkPendingReceipts();
    };
    if (modalVisible) {
      loadPrinter();
      if (isStrictMpesa) {
        setPaymentMethod('MPESA');
        setIsSplitPayment(false);
        setActiveField('PHONE');
        setMpesaPortion(totals.finalTotal.toString());
      }
    }
  }, [modalVisible]);

  useEffect(() => {
    if (paymentMethod === 'MPESA' || isStrictMpesa) {
      setMpesaPortion(totals.finalTotal.toString());
    }
  }, [totals.finalTotal, paymentMethod, isStrictMpesa]);

  const checkPendingReceipts = async () => {
    const data = await AsyncStorage.getItem("PENDING_RECEIPTS");
    const receipts = data ? JSON.parse(data) : [];
    setPrintCount(receipts.length);
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
        } catch { remaining.push(r); }
      }
      await AsyncStorage.setItem("PENDING_RECEIPTS", JSON.stringify(remaining));
      setPrintCount(remaining.length);
    } finally { setRetrying(false); }
  };

  const finalizeCheckout = async () => {
    const { remaining } = paymentTotals;
    if (remaining > 0.05) {
      setMsg({ msg: `Balance of Ksh ${remaining.toFixed(2)} unpaid`, state: "error" });
      return;
    }

    setProcessing(true);
    try {
      let mpesaData = null;
      const mpesaToCharge = isSplitPayment
        ? parseFloat(mpesaPortion) || 0
        : (paymentMethod === 'MPESA' || isStrictMpesa ? totals.finalTotal : 0);

      if (mpesaToCharge > 0) {
        const result = await handleSTK(phoneNumber, mpesaToCharge, business || businessData);
        if (!result.success) {
          setMsg({ msg: `M-Pesa Failed: ${result.error}`, state: "error" });
          setProcessing(false);
          return;
        }
        mpesaData = result.mpesa;
      }

      const receiptNo = await getNextReceiptNumber();
      const finalMethod = isSplitPayment ? 'SPLIT' : paymentMethod;
      const cashPortion = isSplitPayment ? (parseFloat(amountGiven) || 0) : (paymentMethod === 'CASH' ? totals.finalTotal : 0);
      const invoiceId = `INV${Date.now().toString().slice(-6)}`;

      const receiptText = buildReceiptText({
        invoiceId, receiptNo, user, cartItems, method: finalMethod,
        paid: parseFloat(amountGiven) || 0, paidCash: cashPortion,
        paidMpesa: mpesaToCharge, mpesaData, totals,
        deliveryFee: details.deliveryFee,
        business: business || businessData, phoneNumber,
        changeDue: paymentTotals.change, customerPin,
      });

      if (selectedPrinterMac) {
        try {
          // Print Receipt
          await printToPrinter(selectedPrinterMac, receiptText, "https://mtandao.app", business?.printQr);

          // Print Delivery Note if applicable
          if (delivering && details.customerName) {
            const deliveryNoteText = buildDeliveryText({
              invoiceId, receiptNo, user,
              customerName: details.customerName,
              phoneNumber: details.phoneNumber,
              address: details.address,
              deliveryFee: details.deliveryFee,
              isExpress: details.isExpress,
              notes: details.notes,
              business: business || businessData,
            });
            await printToPrinter(selectedPrinterMac, deliveryNoteText, "https://mtandao.app", business?.printQr);
          }
        } catch {
          await savePendingReceipt({ receiptNo, method: finalMethod, phone: phoneNumber, amount: totals.finalTotal, receiptText });
        }
      }

      await PostLocally(receiptNo, finalMethod, phoneNumber, totals.finalTotal, mpesaData, null, cashPortion, mpesaToCharge, customerPin);

      setMsg({ msg: "Transaction Complete", state: "success" });
      setTimeout(() => {
        clearCart();
        setModalVisible(false);
        setAmountGiven(""); setMpesaPortion(""); setPhoneNumber(""); setCustomerPin("");
        setDelivering(false);
        setDetails({ customerName: '', phoneNumber: '', address: '', isExpress: false, notes: '', deliveryFee: 0 });
      }, 1000);
    } catch (err) {
      setMsg({ msg: "Failed to finalize sale", state: "error" });
    } finally { setProcessing(false); }
  };

  return (
    <>
      <Modal animationType="slide" transparent={false} visible={modalVisible}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state as any} />}

          <Modal visible={showItemsList} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={[styles.itemsContainer, { backgroundColor: colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Review Items</Text>
                  <TouchableOpacity onPress={() => setShowItemsList(false)}>
                    <Ionicons name="close" size={28} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={cartItems}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.product_name}</Text>
                        <Text style={{ color: colors.subText, fontSize: 12 }}>{item.quantity} x {item.price.toLocaleString()}</Text>
                      </View>
                      <Text style={[styles.itemTotal, { color: colors.text }]}>{(item.price * item.quantity).toLocaleString()}</Text>
                    </View>
                  )}
                />
                <TouchableOpacity style={[styles.closeItemsBtn, { backgroundColor: colors.primary }]} onPress={() => setShowItemsList(false)}>
                  <Text style={styles.closeItemsText}>Back to Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={[styles.header, { borderColor: colors.border }]}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
                <TouchableOpacity onPress={() => setShowItemsList(true)} style={styles.basketBadge}>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>VIEW {cartItems.length} ITEMS</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={[styles.floatingTotalsCard, { backgroundColor: colors.card, borderColor: totals.hasPin ? '#22c55e' : colors.primary + '30' }]}>
              <Text style={{ color: colors.subText, fontWeight: 'bold', fontSize: 11 }}>TOTAL DUE</Text>
              <Text style={[styles.totalAmount, { color: colors.text, fontSize: 32 }]}>Ksh {totals.finalTotal.toLocaleString()}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {totals.hasPin && <Text style={{ color: '#22c55e', fontSize: 11 }}>+ VAT: {totals.tax.toLocaleString()}</Text>}
                {delivering && <Text style={{ color: colors.primary, fontSize: 11 }}>+ Delivery: {totals.deliveryCharge.toLocaleString()}</Text>}
              </View>
            </View>

            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.subText }]}>CUSTOMER KRA PIN</Text>
                <TouchableOpacity onPress={() => setActiveField('PIN')} style={[styles.pinInput, { borderColor: activeField === 'PIN' ? colors.primary : colors.border, backgroundColor: colors.card }]}>
                  <Ionicons name="card-outline" size={20} color={totals.hasPin ? '#22c55e' : colors.subText} />
                  <Text style={[styles.inputText, { color: colors.text, marginLeft: 10, textTransform: 'uppercase' }]}>{customerPin || "e.g. A00..."}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setDeliveryModalVisible(true)}
                style={[styles.splitToggle, { borderColor: delivering ? '#22c55e' : colors.border, backgroundColor: delivering ? '#22c55e10' : 'transparent' }]}
              >
                <Ionicons name={delivering ? "bicycle" : "bicycle-outline"} size={22} color={delivering ? '#22c55e' : colors.primary} />
                <Text style={[styles.splitText, { color: colors.text }]}>{delivering ? `Delivery to ${details.customerName} (Ksh ${details.deliveryFee})` : "Add Delivery Details"}</Text>
                {delivering && <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>

              {hasMpesa && !isStrictMpesa && (
                <TouchableOpacity
                  onPress={() => { setIsSplitPayment(!isSplitPayment); setActiveField(!isSplitPayment ? 'PHONE' : 'CASH_AMT'); }}
                  style={[styles.splitToggle, { borderColor: isSplitPayment ? colors.primary : colors.border, backgroundColor: isSplitPayment ? colors.primary + '10' : 'transparent' }]}
                >
                  <Ionicons name={isSplitPayment ? "checkbox" : "square-outline"} size={22} color={colors.primary} />
                  <Text style={[styles.splitText, { color: colors.text }]}>Split Cash & M-Pesa</Text>
                </TouchableOpacity>
              )}

              {!isSplitPayment && !isStrictMpesa && hasMpesa && (
                <View style={[styles.methodSelector, { backgroundColor: colors.card }]}>
                  <TouchableOpacity onPress={() => { setPaymentMethod('CASH'); setActiveField('CASH_AMT'); }} style={[styles.methodBtn, paymentMethod === 'CASH' && { backgroundColor: '#3b82f6' }]}>
                    <Text style={styles.methodBtnText}>CASH</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setPaymentMethod('MPESA'); setActiveField('PHONE'); }} style={[styles.methodBtn, paymentMethod === 'MPESA' && { backgroundColor: '#22c55e' }]}>
                    <Text style={styles.methodBtnText}>M-PESA</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputSection}>
                {(paymentMethod === 'MPESA' || isSplitPayment || isStrictMpesa) && (
                  <View>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.subText }]}>M-PESA PHONE</Text>
                      <TouchableOpacity onPress={() => setActiveField('PHONE')} style={[styles.phoneInput, { borderColor: activeField === 'PHONE' ? colors.primary : colors.border }]}>
                        <Text style={[styles.prefix, { color: colors.primary }]}>+254</Text>
                        <Text style={[styles.inputText, { color: colors.text }]}>{phoneNumber || "7..."}</Text>
                      </TouchableOpacity>
                    </View>
                    {isSplitPayment && (
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.subText }]}>M-PESA PORTION</Text>
                        <TouchableOpacity onPress={() => setActiveField('MPESA_AMT')} style={[styles.cashInput, { borderColor: activeField === 'MPESA_AMT' ? colors.primary : colors.border }]}>
                          <Text style={[styles.inputTextLarge, { color: colors.text }]}>Ksh {mpesaPortion || "0.00"}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {!isStrictMpesa && (paymentMethod === 'CASH' || isSplitPayment || !hasMpesa) && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.subText }]}>{isSplitPayment ? 'CASH PORTION' : 'CASH COLLECTED'}</Text>
                    <TouchableOpacity onPress={() => setActiveField('CASH_AMT')} style={[styles.cashInput, { borderColor: activeField === 'CASH_AMT' ? colors.primary : colors.border, backgroundColor: colors.card }]}>
                      <Text style={[styles.inputTextLarge, { color: colors.text }]}>Ksh {amountGiven || "0.00"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Keypad
                activeField={activeField === 'PIN' ? "customerPin" : undefined}
                value={activeField === 'PHONE' ? phoneNumber : activeField === 'PIN' ? customerPin : activeField === 'MPESA_AMT' ? mpesaPortion : amountGiven}
                onChange={handleKeypadChange}
              />

              {paymentTotals.change > 0 && (
                <View style={styles.changeCard}>
                  <Text style={styles.changeLabel}>CHANGE DUE</Text>
                  <Text style={styles.changeValue}>Ksh {paymentTotals.change.toFixed(2)}</Text>
                </View>
              )}
              <View style={{ height: 120 }} />
            </ScrollView>

            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowPrinterModal(true)} style={[styles.printerBtn, { backgroundColor: selectedPrinterMac ? '#22c55e20' : '#ef444420' }]}>
                <Icon name="print" size={20} color={selectedPrinterMac ? '#22c55e' : '#ef4444'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={finalizeCheckout} disabled={processing} style={[styles.checkoutBtn, { backgroundColor: processing ? colors.primaryDark : '#22c55e' }]}>
                {processing ? <ActivityIndicator color="white" /> : <Text style={styles.checkoutText}>COMPLETE TRANSACTION</Text>}
              </TouchableOpacity>
            </View>

            <PrinterSelectionModal
              visible={showPrinterModal}
              onClose={() => setShowPrinterModal(false)}
              onSelect={(mac) => {
                setSelectedPrinterMac(mac);
                AsyncStorage.setItem('SELECTED_PRINTER_MAC', mac);
              }}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Root level Modal to prevent input blocking */}
      <DeliveryDetailsModal
        isVisible={isDeliveryModalVisible}
        details={details}
        setDetails={setDetails}
        onClose={() => setDeliveryModalVisible(false)}
        onConfirm={handleDeliveryConfirm}
      />
    </>
  );
};

// ... Styles remain the same as your input ...
const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  basketBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  closeBtn: { backgroundColor: '#ef4444', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scrollBody: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  syncBtn: { backgroundColor: '#f59e0b', padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  splitToggle: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
  splitText: { marginLeft: 10, fontWeight: '700', flex: 1 },
  methodSelector: { flexDirection: 'row', padding: 6, borderRadius: 16, marginBottom: 20, gap: 5 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  methodBtnText: { color: 'white', fontWeight: 'bold' },
  inputSection: { marginBottom: 10 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  phoneInput: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 2, backgroundColor: '#0f172a' },
  prefix: { fontSize: 18, fontWeight: '900' },
  inputText: { fontSize: 18, fontWeight: '800', marginLeft: 5 },
  cashInput: { padding: 18, borderRadius: 16, borderWidth: 2, alignItems: 'center', backgroundColor: '#0f172a' },
  inputTextLarge: { fontSize: 26, fontWeight: '900' },
  changeCard: { marginTop: 15, padding: 15, backgroundColor: '#f97316', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  changeLabel: { color: 'white', fontWeight: 'bold' },
  changeValue: { color: 'white', fontSize: 20, fontWeight: '900' },
  bottomBar: { padding: 20, flexDirection: 'row', borderTopWidth: 1 },
  printerBtn: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  checkoutBtn: { flex: 1, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  checkoutText: { color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  itemsContainer: { borderRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  itemName: { fontWeight: '700', fontSize: 15 },
  itemTotal: { fontWeight: '800' },
  closeItemsBtn: { marginTop: 20, padding: 15, borderRadius: 14, alignItems: 'center' },
  closeItemsText: { color: 'white', fontWeight: 'bold' },
  pinInput: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 2, marginTop: 5 },
  floatingTotalsCard: { marginHorizontal: 20, marginTop: 10, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, alignItems: 'center', zIndex: 10 },
  totalAmount: { fontWeight: '900', marginVertical: 2 },
});

export default CheckoutModal;