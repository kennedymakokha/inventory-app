import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Platform, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, CameraType } from 'react-native-camera-kit';
import { InputContainer, TextArea } from '../../../components/Input';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Theme } from '../../../utils/theme';

const AddProductModal = ({
    modalVisible,
    msg,
    setMsg,
    setItem,
    PostLocally,
    categories,
    item,
    setModalVisible,
    isDarkMode
}: any) => {
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const theme = isDarkMode ? Theme.dark : Theme.light;
    const handleChange = (key: string, value: any) => {
        setMsg({ msg: "", state: "" });
        setItem((prev: any) => ({ ...prev, [key]: value }));
    };


    const handleBarcodeRead = (event: any) => {
        const data = event.nativeEvent.codeStringValue;
        if (data) {
            // Set the barcode field specifically
            handleChange("barcode", data);
            setIsScannerOpen(false);
            setMsg({ msg: "✅ Barcode Scanned", state: "success" });
        }
    };
    return (
        <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
            <View style={{ flex: 1, backgroundColor: theme.background }}>

                {/* --- QR SCANNER MODAL --- */}
                <Modal visible={isScannerOpen} animationType="fade" onRequestClose={() => setIsScannerOpen(false)}>
                    <View style={{ flex: 1, backgroundColor: '#000' }}>
                        <Camera
                            style={{ flex: 1 }}
                            cameraType={CameraType.Back}
                            scanBarcode={true}
                            onReadCode={handleBarcodeRead}
                            showFrame={true}
                            laserColor="#22c55e"
                            frameColor="#ffffff"
                        />
                        <View style={styles.scannerOverlay}>
                            <Text style={styles.scannerText}>Align QR/Barcode inside the frame</Text>
                            <TouchableOpacity onPress={() => setIsScannerOpen(false)} style={styles.closeScannerBtn}>
                                <Icon name="close" size={30} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
                    <Text style={[styles.header, { color: '#22c55e' }]}>Add New Product</Text>
                    <InputContainer
                        label="Product Name"
                        placeholder="Enter name"
                        value={item.product_name}
                        onChangeText={(text: string) => handleChange("product_name", text)}
                        // Pass isDarkMode to your custom Input if it supports it
                        isDarkMode={isDarkMode}
                    />

                    {/* Product Name / Barcode Field with Scan Button */}
                    <View style={{ position: 'relative' }}>
                        <InputContainer
                            label=" Barcode"
                            disabled={true}
                            placeholder="Type or scan barcode"
                            value={item.barcode}
                            onChangeText={(text: string) => handleChange("barcode", text)}
                            isDarkMode={isDarkMode}
                        />
                        <TouchableOpacity
                        className='absolute right-4 -bottom-20'
                            onPress={() => setIsScannerOpen(true)}
                            style={styles.inlineScanBtn}
                        >
                            <Icon name="qrcode-scan" size={24} color={isDarkMode ? '#fbbf24' : '#3b82f6'} />
                        </TouchableOpacity>
                    </View>

                    {/* Category Selection */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 6 }}>Category</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <Picker
                                selectedValue={item.category_id}
                                onValueChange={(val) => handleChange("category_id", val)}
                                dropdownIconColor={theme.text}
                                style={{ color: theme.text }}
                            >
                                <Picker.Item label="Select Category" value="" color={theme.placeholder} />
                                {categories?.map((cat: any) => (
                                    <Picker.Item key={cat.id} label={cat.category_name} value={cat.category_id} color={theme.text} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* Pricing Row */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <InputContainer
                                label="Buying Price"
                                placeholder="0.00"
                                value={item.Bprice}
                                onChangeText={(text: string) => handleChange("Bprice", text)}
                                keyboardType="numeric"
                                isDarkMode={isDarkMode}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputContainer
                                label="Selling Price"
                                placeholder="0.00"
                                value={item.price}
                                onChangeText={(text: string) => handleChange("price", text)}
                                keyboardType="numeric"
                                isDarkMode={isDarkMode}
                            />
                        </View>
                    </View>

                    <InputContainer
                        label="Initial Stock Quantity"
                        placeholder="e.g. 50"
                        value={item.initial_stock}
                        onChangeText={(text: string) => handleChange("initial_stock", text)}
                        keyboardType="numeric"
                        isDarkMode={isDarkMode}
                    />

                    {/* Expiry Date */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 6 }}>Expiry Date</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={[styles.dateBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                        >
                            <Text style={{ color: item.expiryDate ? theme.text : theme.placeholder }}>
                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Set Expiry (Optional)'}
                            </Text>
                            <Icon name="calendar" size={20} color={theme.placeholder} />
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={item.expiryDate ? new Date(item.expiryDate) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(e, date) => {
                                setShowDatePicker(false);
                                if (date) handleChange("expiryDate", date.toISOString());
                            }}
                        />
                    )}

                    <TextArea
                        theme={theme}
                        placeholder="Additional notes or description..."
                        value={item.description}
                        onChangeText={(text: string) => handleChange("description", text)}
                        isDarkMode={isDarkMode}
                    />

                    {msg.msg && <Toast msg={msg.msg} state={msg.state} />}

                    <View style={styles.footerBtns}>
                        <View style={{ flex: 1 }}>
                            <Button loading={false} handleclick={() => setModalVisible(false)} outline title="Cancel" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Button loading={false} handleclick={PostLocally} title="Save Product" />
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 25, textTransform: 'uppercase' },
    inlineScanBtn: { position: 'absolute', right: 12, bottom: 25 },
    pickerContainer: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
    dateBtn: { borderWidth: 1, height: 55, borderRadius: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
    scannerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', alignItems: 'center', padding: 40 },
    scannerText: { color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8, marginTop: 50 },
    closeScannerBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 50, marginBottom: 20 }
});

export default AddProductModal;