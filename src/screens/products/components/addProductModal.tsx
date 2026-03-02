import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, CameraType } from 'react-native-camera-kit';
import { InputContainer, TextArea } from '../../../components/Input';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Theme } from '../../../utils/theme';
import { Animated } from 'react-native';

const AddProductModal = ({
    modalVisible,
    msg,
    setMsg,
    setItem,
    PostLocally,
    loading,
    categories,
    item,
    setModalVisible,
    isDarkMode
}: any) => {

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const theme = isDarkMode ? Theme.dark : Theme.light;
    const buying = parseFloat(item.Bprice) || 0;
    const selling = parseFloat(item.price) || 0;

    const profit = selling - buying;
    const margin = buying > 0 ? ((profit / buying) * 100).toFixed(1) : 0;

    const handleChange = (key: string, value: any) => {
        setMsg({ msg: "", state: "" });
        setItem((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleBarcodeRead = (event: any) => {
        const data = event.nativeEvent.codeStringValue;
        if (data) {
            handleChange("barcode", data);
            setIsScannerOpen(false);
            setMsg({ msg: "Barcode Scanned Successfully", state: "success" });
        }
    };
    const isFormValid =
        item.product_name &&
        item.category_id &&
        selling > 0 &&
        item.initial_stock;

    const fadeAnim = useState(new Animated.Value(0))[0];

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);
    return (
        <Modal
            animationType="slide"
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>

                {/* ================= SCANNER MODAL ================= */}
                <Modal
                    visible={isScannerOpen}
                    animationType="fade"
                    onRequestClose={() => setIsScannerOpen(false)}
                >
                    <View style={styles.scannerContainer}>
                        <Camera
                            style={{ flex: 1 }}
                            cameraType={CameraType.Back}
                            scanBarcode
                            onReadCode={handleBarcodeRead}
                            showFrame
                            laserColor="#22c55e"
                            frameColor="#ffffff"
                        />

                        <View style={styles.scannerOverlay}>
                            <Text style={styles.scannerText}>
                                Align barcode inside the frame
                            </Text>

                            <TouchableOpacity
                                onPress={() => setIsScannerOpen(false)}
                                style={styles.closeScannerBtn}
                            >
                                <Icon name="close" size={26} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* ================= FORM ================= */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Animated.Text
                        style={[
                            styles.header,
                            { color: theme.text, opacity: fadeAnim }
                        ]}
                    >
                        Add New Product
                    </Animated.Text>
                    {/* PRODUCT NAME */}
                    <InputContainer
                        label="Product Name"
                        placeholder="Enter product name"
                        value={item.product_name}
                        onChangeText={(text: string) =>
                            handleChange("product_name", text)
                        }
                        isDarkMode={isDarkMode}
                    />

                    {/* BARCODE FIELD */}
                    <View style={styles.barcodeWrapper}>
                        <InputContainer
                            label="Barcode"
                            placeholder="Scan barcode"
                            value={item.barcode}
                            disabled
                            isDarkMode={isDarkMode}
                        />

                        <TouchableOpacity
                            onPress={() => setIsScannerOpen(true)}
                            style={styles.scanBtn}
                        >
                            <Icon
                                name="qrcode-scan"
                                size={22}
                                color={isDarkMode ? '#fbbf24' : '#2563eb'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* CATEGORY */}
                    <View style={styles.sectionSpacing}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Category
                        </Text>

                        <View style={[
                            styles.pickerContainer,
                            { backgroundColor: theme.inputBg, borderColor: theme.border }
                        ]}>
                            <Picker
                                selectedValue={item.category_id}
                                onValueChange={(val) =>
                                    handleChange("category_id", val)
                                }
                                dropdownIconColor={theme.text}
                                style={{ color: theme.text }}
                            >
                                <Picker.Item
                                    label="Select Category"
                                    value=""
                                    color={theme.placeholder}
                                />
                                {categories?.map((cat: any) => (
                                    <Picker.Item
                                        key={cat.id}
                                        label={cat.category_name}
                                        value={cat.category_id}
                                        color={theme.text}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* PRICE ROW */}
                    <View style={styles.priceRow}>
                        <View style={{ flex: 1 }}>
                            <InputContainer
                                label="Buying Price"
                                placeholder="0.00"
                                value={item.Bprice}
                                onChangeText={(text: string) =>
                                    handleChange("Bprice", text)
                                }
                                keyboardType="numeric"
                                isDarkMode={isDarkMode}
                            />
                        </View>
                        {buying > 0 && selling > 0 && (
                            <View
                                style={{
                                    backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9',
                                    padding: 14,
                                    height: 48,
                                    borderRadius: 6,
                                    marginTop: 1,
                                    borderWidth: 1,
                                    borderColor: profit < 0 ? '#ef4444' : '#22c55e',
                                }}
                            >
                                <Text style={{
                                    color: profit < 0 ? '#ef4444' : '#22c55e',
                                    fontWeight: '700'
                                }}>
                                    P: {profit}  |  M: {margin}%
                                </Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <InputContainer
                                label="Selling Price"
                                placeholder="0.00"
                                value={item.price}
                                onChangeText={(text: string) =>
                                    handleChange("price", text)
                                }
                                keyboardType="numeric"
                                isDarkMode={isDarkMode}
                            />
                        </View>
                    </View>

                    {/* STOCK */}
                    <InputContainer
                        label="Initial Stock Quantity"
                        placeholder="e.g. 50"
                        value={item.initial_stock}
                        onChangeText={(text: string) =>
                            handleChange("initial_stock", text)
                        }
                        keyboardType="numeric"
                        isDarkMode={isDarkMode}
                    />

                    {/* EXPIRY DATE */}
                    <View style={styles.sectionSpacing}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Expiry Date (Optional)
                        </Text>

                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={[
                                styles.dateBtn,
                                { backgroundColor: theme.inputBg, borderColor: theme.border }
                            ]}
                        >
                            <Text
                                style={{
                                    color: item.expiryDate
                                        ? theme.text
                                        : theme.placeholder
                                }}
                            >
                                {item.expiryDate
                                    ? new Date(item.expiryDate).toLocaleDateString()
                                    : "Set Expiry Date"}
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
                                if (date)
                                    handleChange("expiryDate", date.toISOString());
                            }}
                        />
                    )}

                    {/* DESCRIPTION */}
                    <TextArea
                        theme={theme}
                        placeholder="Additional notes..."
                        value={item.description}
                        onChangeText={(text: string) =>
                            handleChange("description", text)
                        }
                        isDarkMode={isDarkMode}
                    />

                    {msg.msg && <Toast msg={msg.msg} state={msg.state} />}

                    {/* FOOTER BUTTONS */}
                    <View style={styles.footerBtns}>
                        <View style={{ flex: 1 }}>
                            <Button
                                loading={loading}
                                handleclick={() => setModalVisible(false)}
                                outline
                                title="Cancel"
                            />
                        </View>

                        <View style={{
                            position: 'absolute',
                            bottom: 25,
                            left: 24,
                            right: 24,
                        }}>
                            <Button
                                loading={loading}
                                handleclick={PostLocally}
                                title="Save Product"
                                disabled={!isFormValid}
                            />
                        </View>
                    </View>

                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({

    container: { flex: 1 },

    scrollContent: {
        padding: 24,
        paddingBottom: 120,
    },

    header: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 30,
    },

    barcodeWrapper: {
        position: 'relative',
    },

    scanBtn: {
        position: 'absolute',
        right: 12,
        bottom: 30,
    },

    sectionSpacing: {
        marginTop: 12,
        marginBottom: 6,
    },

    label: {
        fontWeight: '600',
        marginBottom: 6,
    },

    pickerContainer: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },

    priceRow: {
        flexDirection: 'row',
        gap: 12,
    },

    dateBtn: {
        borderWidth: 1,
        height: 55,
        borderRadius: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    footerBtns: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 30,
    },

    scannerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },

    scannerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60,
    },

    scannerText: {
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },

    closeScannerBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 14,
        borderRadius: 50,
    },
});

export default AddProductModal;