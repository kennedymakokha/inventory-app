import React from 'react';
import { ScrollView } from 'react-native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Switch
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/themeContext';

interface DeliveryModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: (details: DeliveryDetails) => void;
    details: DeliveryDetails;
    setDetails: any;
}

export interface DeliveryDetails {
    customerName: string;
    phoneNumber: string;
    address: string;
    isExpress: boolean;
    notes: string;
    deliveryFee: number; // Changed to required for logic consistency
}

const DeliveryDetailsModal = ({ isVisible, onClose, onConfirm, details, setDetails }: DeliveryModalProps) => {
    const { colors } = useTheme();

    const handleConfirm = () => {
        if (!details.customerName || !details.address) return;
        onConfirm(details);
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        <View style={[styles.handle, { backgroundColor: colors.border }]} />

                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.text }]}>Delivery Details</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close-circle" size={28} color={colors.subText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Customer Name */}
                            <Text style={[styles.label, { color: colors.subText }]}>RECIPIENT NAME</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="John Doe"
                                placeholderTextColor={colors.subText}
                                value={details.customerName}
                                onChangeText={(val) => setDetails({ ...details, customerName: val })}
                            />

                            {/* Phone Number */}
                            <Text style={[styles.label, { color: colors.subText }]}>PHONE NUMBER</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="07..."
                                keyboardType="phone-pad"
                                placeholderTextColor={colors.subText}
                                value={details.phoneNumber}
                                onChangeText={(val) => setDetails({ ...details, phoneNumber: val })}
                            />

                            {/* Delivery Fee - NEW FIELD */}
                            <Text style={[styles.label, { color: colors.subText }]}>DELIVERY CHARGES (KSH)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.primary + '40', fontWeight: 'bold' }]}
                                placeholder="0.00"
                                keyboardType="numeric"
                                placeholderTextColor={colors.subText}
                                value={details.deliveryFee?.toString()}
                                onChangeText={(val) => setDetails({ ...details, deliveryFee: parseFloat(val) || 0 })}
                            />

                            {/* Address */}
                            <Text style={[styles.label, { color: colors.subText }]}>DELIVERY ADDRESS</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="Building, Street, Apartment No..."
                                multiline
                                numberOfLines={3}
                                placeholderTextColor={colors.subText}
                                value={details.address}
                                onChangeText={(val) => setDetails({ ...details, address: val })}
                            />

                            {/* Express Toggle */}
                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={[styles.switchTitle, { color: colors.text }]}>Express Delivery</Text>
                                    <Text style={[styles.switchSub, { color: colors.subText }]}>Prioritize this order</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                    thumbColor={details.isExpress ? colors.primary : '#f4f3f4'}
                                    onValueChange={(val) => setDetails({ ...details, isExpress: val })}
                                    value={details.isExpress}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: (details.customerName && details.address) ? 1 : 0.6 }]}
                                onPress={handleConfirm}
                                disabled={!details.customerName || !details.address}
                            >
                                <Text style={styles.submitBtnText}>Confirm & Add Charges</Text>
                                <Ionicons name="checkmark-done" size={20} color="#fff" />
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '85%',
        borderWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 55,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    textArea: {
        height: 80,
        paddingTop: 16,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 4,
    },
    switchTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    switchSub: {
        fontSize: 13,
    },
    submitBtn: {
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
});

export default DeliveryDetailsModal;