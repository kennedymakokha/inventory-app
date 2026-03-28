import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, CameraType } from 'react-native-camera-kit';
import { Picker } from '@react-native-picker/picker';
import { InputContainer, TextArea } from '../../../components/Input';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { useTheme } from '../../../context/themeContext';

const AddProductModal = ({
    modalVisible,
    msg,
    setMsg,
    item,           
    setItem,        
    PostLocally,    
    loading,
    categories,
    setModalVisible,
    onClose,
    isDarkMode
}: any) => {
    const { colors } = useTheme();
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const buying = parseFloat(item?.Bprice) || 0;
    const selling = parseFloat(item?.price) || 0;
    const profit = selling - buying;
    const margin = buying > 0 ? ((profit / buying) * 100).toFixed(1) : 0;

    const handleChange = (key: string, value: any) => {
        if (msg?.msg) setMsg({ msg: "", state: "" });
        setItem((prev: any) => ({ ...prev, [key]: value }));
    };

    const validateAndSubmit = () => {
        if (!item?.product_name || !item?.price || !item?.category_id) {
            setMsg({ msg: "Missing Name, Price, or Category", state: "error" });
            return;
        }
        PostLocally();
    };

    const handleBarcodeRead = (event: any) => {
        const data = event.nativeEvent.codeStringValue;
        if (data) {
            handleChange("barcode", data);
            setIsScannerOpen(false);
            setMsg({ msg: "Barcode Scanned", state: "success" });
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity 
                    style={{ flex: 1 }} 
                    activeOpacity={1} 
                    onPress={onClose} 
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.modalContainer, { backgroundColor: colors.background }]}
                >
                    <View style={[styles.handle, { backgroundColor: isDarkMode ? '#334155' : '#e2e8f0' }]} />

                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.headerRow}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="cube-outline" size={26} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.title, { color: colors.text }]}>
                                    {item?.product_id ? "Edit Product" : "New Product"}
                                </Text>
                                <Text style={{ color: colors.subText, fontSize: 13 }}>
                                    Inventory & Pricing Details
                                </Text>
                            </View>
                        </View>

                        <View style={styles.form}>
                            <InputContainer
                                label="Product Name"
                                placeholder="e.g. Fresh Milk 1L"
                                value={item?.product_name || ""}
                                onChangeText={(text: string) => handleChange("product_name", text)}
                            />

                            <View style={styles.barcodeWrapper}>
                                <InputContainer
                                    label="Barcode"
                                    placeholder="Tap icon to scan"
                                    value={item?.barcode || ""}
                                    onChangeText={(text: string) => handleChange("barcode", text)}
                                />
                                <TouchableOpacity onPress={() => setIsScannerOpen(true)} style={styles.scanBtn}>
                                    <Icon name="qrcode-scan" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGap}>
                                <Text style={[styles.label, { color: colors.primary }]}>Category</Text>
                                <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                                    <Picker
                                        selectedValue={item?.category_id}
                                        onValueChange={(val) => handleChange("category_id", val)}
                                        dropdownIconColor={colors.text}
                                        style={{ color: colors.text }}
                                    >
                                        <Picker.Item label="Select Category" value="" color={colors.subText} />
                                        {categories?.map((cat: any) => (
                                            <Picker.Item key={cat.category_id} label={cat.category_name} value={cat.category_id} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.priceRow}>
                                <View style={{ flex: 1 }}>
                                    <InputContainer
                                        label="Buying Price"
                                        placeholder="0.00"
                                        value={item?.Bprice?.toString()}
                                        onChangeText={(text: string) => handleChange("Bprice", text)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <InputContainer
                                        label="Selling Price"
                                        placeholder="0.00"
                                        value={item?.price?.toString()}
                                        onChangeText={(text: string) => handleChange("price", text)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {buying > 0 && selling > 0 && (
                                <View style={[styles.infoBox, { backgroundColor: profit < 0 ? '#FEF2F2' : '#F0FDF4' }]}>
                                    <Ionicons name={profit < 0 ? "alert-circle" : "trending-up"} size={18} color={profit < 0 ? '#EF4444' : '#22C55E'} />
                                    <Text style={[styles.infoText, { color: profit < 0 ? '#B91C1C' : '#15803D' }]}>
                                        Profit: {profit.toFixed(2)} | Margin: {margin}%
                                    </Text>
                                </View>
                            )}

                            <InputContainer
                                label="Current Stock"
                                placeholder="0"
                                value={item?.initial_stock?.toString()}
                                onChangeText={(text: string) => handleChange("initial_stock", text)}
                                keyboardType="numeric"
                            />

                            {/* DESCRIPTION ADDED HERE */}
                            <View style={{ marginTop: 5 }}>
                                <Text style={[styles.label, { color: colors.primary }]}>Description / Notes</Text>
                                <TextArea
                                    placeholder="Additional product details (flavor, size, etc.)"
                                    value={item?.description || ""}
                                    onChangeText={(text: string) => handleChange("description", text)}
                                />
                            </View>
                        </View>

                        {msg?.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}

                        <View style={styles.buttonRow}>
                            <View style={{ flex: 1 }}>
                                <Button handleclick={onClose} outline title="Cancel" />
                            </View>
                            <View style={{ flex: 2 }}>
                                <Button loading={loading} handleclick={validateAndSubmit} title={item?.product_id ? "Update Product" : "Save Product"} />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            <Modal visible={isScannerOpen} animationType="fade">
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <Camera style={{ flex: 1 }} cameraType={CameraType.Back} scanBarcode onReadCode={handleBarcodeRead} showFrame />
                    <TouchableOpacity onPress={() => setIsScannerOpen(false)} style={styles.closeScanner}>
                        <Ionicons name="close-circle" size={60} color="white" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContainer: { borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '92%', elevation: 20 },
    handle: { width: 45, height: 6, borderRadius: 10, alignSelf: 'center', marginVertical: 15 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25 },
    iconCircle: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '800' },
    form: { gap: 10 },
    barcodeWrapper: { position: 'relative' },
    scanBtn: { position: 'absolute', right: 12, bottom: 25 },
    inputGap: { marginTop: 5 },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
    pickerContainer: { borderWidth: 1, borderRadius: 12, height: 55, justifyContent: 'center', overflow: 'hidden' },
    priceRow: { flexDirection: 'row', gap: 12 },
    infoBox: { flexDirection: 'row', padding: 14, borderRadius: 12, gap: 10, alignItems: 'center' },
    infoText: { fontSize: 14, fontWeight: '700' },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 35, alignItems: 'center' },
    closeScanner: { position: 'absolute', bottom: 50, alignSelf: 'center' }
});

export default AddProductModal;