import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,

} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from 'react-redux';
import { CartItem } from '../../../../models';
import { printToPrinter as printToPrinter } from '../../../services/printerService';
import { getNextReceiptNumber } from '../../../utils/recieptNo';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrinterSelectionModal } from '../../printerSelection';
import { useSettings } from '../../../context/SettingsContext';
import { Theme } from '../../../utils/theme';
import { Animated } from 'react-native';
import { useBusiness } from '../../../context/BusinessContext';
import { useUser } from '../../../context/UserContext';
import { ScrollView } from 'react-native';
import { FineDate, FormatDate } from '../../../../utils/formatDate';
import Keypad from './keypad';

interface CheckoutModalProps {
  modalVisible: boolean;
  isDarkMode?: any
  setMsg?: any
  msg?: any;
  cartItems: CartItem[];
  PostLocally: any;
  setModalVisible: (v: boolean) => void;
}



const CheckoutModal: React.FC<CheckoutModalProps> = ({
  modalVisible,
  cartItems,
  msg,
  PostLocally,
  setMsg,
  setModalVisible,
}) => {
  const { user } = useUser();
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA'>('CASH');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountGiven, setAmountGiven] = useState(''); // Cash input
  const [processing, setProcessing] = useState(false);
  const [selectedPrinterMac, setSelectedPrinterMac] = useState<string | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printCount, setPrintCount] = useState(0);
  const [adjustedCart, setAdjustedCart] = useState<CartItem[]>([...cartItems]);

  const { isDarkMode } = useSettings();
  const theme = isDarkMode ? Theme.dark : Theme.light;
  const { business } = useBusiness();
  const [mpesa, setMpesa] = useState({
    checkoutRequestId: "",
    merchantRequestId: "",
    receiptNumber: "",
    transactionDate: "",
  })
  const [retrying, setRetrying] = useState(false);

  const autoRetryPendingReceipts = async () => {
    if (retrying) return; // جلوگیری duplicate runs

    try {
      setRetrying(true);

      const data = await AsyncStorage.getItem("PENDING_RECEIPTS");
      const receipts = data ? JSON.parse(data) : [];

      if (!receipts.length || !selectedPrinterMac) return;

      const remaining: any[] = [];

      for (const r of receipts) {
        try {
          await printToPrinter(
            selectedPrinterMac,
            r.receiptText,
            `https://mtandao.app`,
            business?.printQr ?? false
          );

          //  Post after successful print
          PostLocally(r.receiptNo, r.method, r.phone, r.amount);

        } catch (err) {
          remaining.push(r);
        }
      }

      await AsyncStorage.setItem("PENDING_RECEIPTS", JSON.stringify(remaining));

      //  Update UI
      setPrintCount(remaining.length);

    } catch (e) {
      console.error("Auto retry error:", e);
    } finally {
      setRetrying(false);
    }
  };
  useEffect(() => {
    // Load saved printer
    const loadPrinter = async () => {
      const saved = await AsyncStorage.getItem('SELECTED_PRINTER_MAC');
      if (saved) setSelectedPrinterMac(saved);
    };
    loadPrinter();
  }, []);

  // Update adjustedCart if cartItems change
  useEffect(() => {
    setAdjustedCart([...cartItems]);
  }, [cartItems]);
  useEffect(() => {
    const init = async () => {
      const data: any = await AsyncStorage.getItem("PENDING_RECEIPTS");
      const receipts = data ? JSON.parse(data) : [];

      setPrintCount(receipts.length);

      //  AUTO RETRY when printer is available
      if (selectedPrinterMac && receipts.length > 0) {
        autoRetryPendingReceipts();
      }
    };

    init();
  }, [selectedPrinterMac]);
  // Grand total based on adjusted prices
  const grandTotal = adjustedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Change calculation
  const changeDue =
    paymentMethod === 'CASH' && parseFloat(amountGiven) > grandTotal
      ? parseFloat(amountGiven) - grandTotal
      : 0;

  const handleSTK = async (receiptNo: string, phoneNumber: string) => {
    try {
      console.log("Initiating STK for phone:", phoneNumber);

      // 1️⃣ Initiate STK push
      const response = await fetch(
        "https://84b2-41-209-9-114.ngrok-free.app/v1/payments/stk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "1234567ss8bcer6",
            "Idempotency-Key": receiptNo,
            "X-Master-Key": "k3f9Jq8sT1vQmZ0uLx7Y2pV+5A1bF4Hq0r9N2wT+6GQ="
          },
          body: JSON.stringify({
            amount: 1, // replace with actual amount if needed
            phone: `254${phoneNumber}`,
            accountReference: business?.business_name,
            description: "Payment"
          })
        }
      );

      const data = await response.json();
      console.log("STK initiated:", data);

      // 2️⃣ Poll transaction status
      let status = "pending";
      let attempts = 0;
      const maxAttempts = 12; // 12 × 5s = 1 minute

      while (status === "pending" && attempts < maxAttempts) {
        // wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        const statusRes = await fetch(
          `https://84b2-41-209-9-114.ngrok-free.app/callbacks/stk/status/${receiptNo}`,
          {
            headers: {
              "x-api-key": "1234567ss8bcer6",
              "X-Master-Key": "k3f9Jq8sT1vQmZ0uLx7Y2pV+5A1bF4Hq0r9N2wT+6GQ="
            }
          }
        );

        const statusData = await statusRes.json();
        status = statusData.status;
        console.log(`Polling attempt ${attempts}:`, status);

        if (status === "success") {
          setMpesa(statusData.mpesa);
          return "success";
        }

        if (status === "failed") {
          setMsg({ msg: "Transaction did not complete", state: "error" });
          return "failed";
        }

        // If still pending → continue polling
      }

      // ⏱️ Timeout if still pending after max attempts
      if (status === "pending") {
        setMsg({ msg: "Transaction timed out", state: "error" });
        return "timeout";
      }

    } catch (error) {
      console.error("handleSTK error:", error);
      setMsg({ msg: "STK Push failed", state: "error" });
      return "failed";
    }
  };
  const savePendingReceipt = async (receipt: any) => {
    try {
      const existing = await AsyncStorage.getItem("PENDING_RECEIPTS");
      const receipts = existing ? JSON.parse(existing) : [];

      const updatedReceipts = [...receipts, receipt];

      await AsyncStorage.setItem(
        "PENDING_RECEIPTS",
        JSON.stringify(updatedReceipts)
      );

      //  UPDATE UI IMMEDIATELY
      setPrintCount(updatedReceipts.length);

    } catch (e) {
      console.error("Error saving pending receipt", e);
    }
  };

  const retryPendingReceipts = async () => {
    try {
      const data = await AsyncStorage.getItem("PENDING_RECEIPTS");
      const receipts = data ? JSON.parse(data) : [];

      if (!receipts.length) {
        Alert.alert("Info", "No pending receipts.");
        return;
      }

      const remaining: any[] = [];

      for (const r of receipts) {
        try {
          await printToPrinter(
            selectedPrinterMac!,
            r.receiptText,
            `https://mtandao.app`,
            business?.printQr ?? false
          );

          //  Post ONLY after successful print
          PostLocally(r.receiptNo, r.method, r.phone, r.amount);

        } catch (err) {
          remaining.push(r); // still failed
        }
      }

      await AsyncStorage.setItem("PENDING_RECEIPTS", JSON.stringify(remaining));

      Alert.alert(
        "Done",
        remaining.length
          ? "Some receipts still failed to print."
          : "All pending receipts printed successfully."
      );
    } catch (e) {
      console.error(e);
    }
  };
  // Finalize checkout
  const finalizeCheckout = async (
    method: "CASH" | "MPESA",
    paidAmount: number
  ) => {
    if (method === "CASH" && paidAmount < grandTotal) {
      Alert.alert("Insufficient Cash", "Amount given is less than total.");
      return;
    }

    const receiptNo = await getNextReceiptNumber();
    const invoiceId = `INV${Date.now().toString().slice(-6)}`;
    const displayReceiptNo = `RCPT${receiptNo}`;

    try {
      setProcessing(true);

      //  STEP 1: MPESA must succeed FIRST
      if (method === "MPESA") {
        const status = await handleSTK(receiptNo, phoneNumber);

        if (status === "timeout") {
          Alert.alert("Timeout", "Customer did not complete payment in time.");
          return;
        }

        if (status !== "success") {
          Alert.alert("Payment Failed", "MPESA transaction failed.");
          return;
        }
      }
      const buildReceiptText = ({
        receiptNo,
        invoiceId,
        cartItems,
        user,
        paymentMethod,
        amountPaid,
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
        text += `Receipt No: ${receiptNo}\nInvoice ID: ${invoiceId}\nPayment: ${paymentMethod}\n`;
        if (mpesa.receiptNumber) text += `Trans ID: ${mpesa.receiptNumber}\n`;
        if (mpesa.receiptNumber) text += `Paid via: ${phoneNumber}\n`;
        text += `Date: ${FineDate(`${mpesa.transactionDate}`)} \n${line}ITEMS\n`;

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
        text += `TOTAL`.padEnd(width - grandTotal.toFixed(2).length) + grandTotal.toFixed(2) + '\n';
        text += line;
        text += `Amount Paid`.padEnd(width - amountPaid.toFixed(2).length) + amountPaid.toFixed(2) + '\n';
        text += `Change`.padEnd(width - (amountPaid - grandTotal).toFixed(2).length) + (amountPaid - grandTotal).toFixed(2) + '\n';
        text += line;

        text += center(`MPESA TILL: 123456`);
        text += center('Prices VAT Inclusive');
        text += center('Thank You!');
        if (user?.name) text += `Served by: ${user.name}\n`;

        return text;
      };
      //  STEP 2: Build receipt
      const receiptText = buildReceiptText({
        receiptNo: displayReceiptNo,
        invoiceId,
        cartItems: adjustedCart,
        user,
        paymentMethod: method,
        amountPaid: paidAmount,
      });

      const receiptPayload = {
        receiptNo,
        method,
        phone: phoneNumber,
        amount: paidAmount,
        receiptText,
      };

      // ❗ Ensure printer exists
      if (!selectedPrinterMac) {
        Alert.alert("Printer Error", "No printer selected.");
        return;
      }

      //  STEP 3: PRINT FIRST
      try {
        await printToPrinter(
          selectedPrinterMac,
          receiptText,
          `https://mtandao.app`,
          business?.printQr ?? false
        );

        //  ONLY AFTER PRINT SUCCESS → POST
        PostLocally(receiptNo, method, phoneNumber, paidAmount);

      } catch (printErr) {
        console.error(printErr);

        //  Save for retry
        await savePendingReceipt(receiptPayload);

        Alert.alert(
          "Printer Error",
          "Payment successful, but printing failed.\nYou can reprint from pending receipts."
        );

        return;
      }

      //  CLEANUP
      setPhoneNumber("");
      setAmountGiven("");
      setModalVisible(false);

    } catch (err) {
      console.error("Checkout Error:", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setProcessing(false);
    }
  };
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // const 
  useEffect(() => {
    const findPending = async () => {
      const data: any = await AsyncStorage.getItem("PENDING_RECEIPTS");
      const receipts = data ? JSON.parse(data) : [];
      setPrintCount(receipts?.length)
    }
    findPending()
    if (!selectedPrinterMac) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [selectedPrinterMac]);
  console.log(mpesa)
  return (
    <Modal animationType="fade" transparent={false} visible={modalVisible}>
      <SafeAreaView className="flex-1 bg-slate-900 pt-20">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* SUMMARY CARD */}
            <View className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
              <View className="flex-row justify-between items-end my-4 px-4 py-6">
                <View>
                  <Text className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                    Total Payable
                  </Text>
                  <Text className="text-green-400 text-4xl font-black">
                    Ksh {grandTotal.toLocaleString()}
                  </Text>
                </View>
                <Icon name="file-invoice-dollar" size={30} color="#1e293b" />
              </View>

              <View className="h-[1px] bg-slate-800 w-full my-4" />

              <FlatList
                data={adjustedCart}
                scrollEnabled={true}
                nestedScrollEnabled
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }: any) => (
                  <View className="flex-row justify-between mb-2 px-4 items-center">
                    <Text className="text-slate-400 font-medium">
                      {item.product_name} <Text className="text-slate-600">x{item.quantity}</Text>
                    </Text>
                    <TextInput
                      value={item.price.toString()}
                      keyboardType="numeric"
                      onChangeText={(val) => {
                        const newVal = parseFloat(val) || 0;
                        if (newVal < item.cost_price) {
                          Alert.alert(
                            'Invalid Price',
                            `Price cannot be lower than the cost price (${item.cost_price})`
                          );
                          return;
                        }
                        const updated = [...adjustedCart];
                        updated[index].price = newVal;
                        setAdjustedCart(updated);
                      }}
                      className="text-slate-300 font-bold w-16 text-right"
                    />
                  </View>
                )}
              />
            </View>

            {/* PAYMENT SELECTOR */}
            <Text className="text-slate-500 font-black mb-4 uppercase text-[10px] tracking-[2px]">
              Choose Method
            </Text>
            <View className="flex-row w-full items-center justify-center gap-x-3 space-x-3 mb-8">
              <TouchableOpacity
                onPress={() => setPaymentMethod("CASH")}
                className={`w-[48%] py-4 rounded items-center ${paymentMethod === "CASH" ? "bg-green-600" : "bg-slate-800"
                  }`}
              >
                <Text className="text-white font-bold">CASH</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMethod("MPESA")}
                className={`w-[48%] py-4 rounded items-center ${paymentMethod === "MPESA" ? "bg-green-600" : "bg-slate-800"
                  }`}
              >
                <Text className="text-white font-bold">MPESA</Text>
              </TouchableOpacity>

            </View>

            {/* DYNAMIC INPUT AREA */}
            <View className="flex-1">
              {paymentMethod === 'MPESA' ? (
                <View className="animate-in slide-in-from-bottom">
                  <Text className="text-slate-400 font-bold mb-2 ml-1">Customer Phone Number</Text>
                  <View className="bg-slate-900 border border-slate-700 rounded-sm flex-row items-center px-4">
                    <Text className="text-slate-500 font-bold text-lg mr-2">+254</Text>
                    <TextInput
                      placeholder="712345678"
                      placeholderTextColor="#475569"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      maxLength={9}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, "");
                        setPhoneNumber(cleaned);
                      }}
                      className="flex-1 text-white py-4 font-black text-xl"
                    />
                  </View>
                </View>
              ) : (
                <View className="animate-in slide-in-from-bottom">
                  <Text className="text-slate-400 font-bold mb-2 ml-1">Amount Given (Ksh)</Text>
                  <View className="bg-slate-900 border border-slate-700 rounded-sm flex-col items-center py-4 px-4">
                    <View className="bg-slate-900 border border-slate-700 rounded-lg py-3 px-4" >
                      <Text className="text-white text-4xl font-black text-center">
                        Ksh {amountGiven || "0"}
                      </Text>
                    </View>

                    <Keypad
                      value={amountGiven}
                      onChange={setAmountGiven}
                    />
                  </View>
                  {parseFloat(amountGiven) > 0 && (
                    <View className="mt-4 flex-row justify-between px-2">
                      <Text className="text-slate-500 font-bold">CHANGE DUE:</Text>
                      <Text className="text-green-400 font-black text-lg">
                        Ksh {changeDue.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            {printCount > 0 && <TouchableOpacity
              onPress={retryPendingReceipts}
              className="bg-yellow-600 py-3 flex-row  rounded items-center justify-between px-10 mt-2"
            >
              <Text className="text-white font-bold">Retry Pending Receipts</Text>
              <View className='flex rounded-md px-1 w-10  items-center ' style={{ borderColor: theme.border }}><Text>{printCount}</Text></View>
            </TouchableOpacity>}
            {/* ACTION BUTTONS */}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* PRINTER LINK */}



      <View className="flex flex-row w-full h-20 gap-x-1" style={{ backgroundColor: theme.background }}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className={`flex justify-center items-center h-full  ${selectedPrinterMac ? "bg-slate-700  w-[0%]" : "bg-red-600 w-[20%] "} `}>
          <TouchableOpacity onPress={() => setShowPrinterModal(true)}>
            <Text className="text-white text-center">
              {selectedPrinterMac ? <Icon name="print" size={30} color="#1e293b" /> : "No Printer Linked"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={() =>
            paymentMethod === 'MPESA'
              ? finalizeCheckout('MPESA', grandTotal)
              : finalizeCheckout('CASH', parseFloat(amountGiven))
          }
          disabled={processing || (paymentMethod === 'CASH' && !amountGiven)}
          className={`flex justify-center rounded-sm shadow-xl ${selectedPrinterMac ? " w-[78%]" : "w-[58%] "}   items-center h-full ${processing || (paymentMethod === 'CASH' && !amountGiven)
            ? 'bg-slate-700'
            : 'bg-green-600'
            } `}>

          <Text className="text-white font-black text-sm text-center uppercase tracking-widest">
            {processing
              ? 'Processing...'
              : paymentMethod === 'MPESA'
                ? 'Send STK & Print'
                : 'Confirm & Print Receipt'}
          </Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: Theme.danger }} className="flex justify-center items-center h-full w-[20%] ">
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            disabled={processing}
            className="flex items-center w-full h-full justify-center"
          >
            <Text className="text-slate-500 text-center font-bold"><Ionicons name="close-sharp" size={30} color="#1e293b" style={{ backgroundColor: Theme.danger }} /> </Text>
          </TouchableOpacity>
        </View>
      </View>


      <PrinterSelectionModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onSelect={(mac) => {
          setSelectedPrinterMac(mac);

          //  trigger retry immediately
          setTimeout(() => {
            autoRetryPendingReceipts();
          }, 500);
        }}
      />
    </Modal>
  );
};

export default CheckoutModal;