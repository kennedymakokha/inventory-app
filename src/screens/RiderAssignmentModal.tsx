import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/themeContext';
import { getRiderDeliveryStats } from '../services/closeOpen.service';

const RiderAssignmentModal = ({
    isVisible,
    onClose,
    onConfirm,
    rider,
    setRider,
    existingRiders = []
}: any) => {
    const { colors } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);
    const [Riders, setRiders] = useState([])
    // Filter riders from DB based on the name being typed
    const filteredRiders = Riders.filter((r: any) =>
        r.name.toLowerCase().includes(rider.name.toLowerCase())
    );

    const handleSelectRider = (selected: any) => {
        setRider({
            name: selected.name,
            phone: selected.phone,
            vehicleNo: selected.vehicleNo
        });
        setShowDropdown(false);
    };

    useEffect(() => {
        const fetchRiders = async () => {
           try {
             console.log("first")
            const riders: any = await getRiderDeliveryStats()
            console.log(riders)
            setRiders(riders)
           } catch (error) {
            console.log(error)
           }
        }
        fetchRiders()
    }, [])


    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.modalBox, { backgroundColor: colors.card }]}
                >
                    <Text style={[styles.title, { color: colors.text }]}>Dispatch Rider</Text>

                    {/* RIDER NAME / SEARCH FIELD */}
                    <View style={[styles.inputGroup, { marginBottom: showDropdown && filteredRiders.length > 0 ? 5 : 20 }]}>
                        <Ionicons name="person-outline" size={20} color={colors.subText} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Rider Name"
                            value={rider.name}
                            placeholderTextColor={colors.subText}
                            onFocus={() => setShowDropdown(true)}
                            onChangeText={(txt) => {
                                setRider({ ...rider, name: txt });
                                setShowDropdown(true);
                            }}
                        />
                        {rider.name.length > 0 && (
                            <TouchableOpacity onPress={() => { setRider({ name: '', phone: '', vehicleNo: '' }); setShowDropdown(false) }}>
                                <Ionicons name="close-circle" size={18} color={colors.subText} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* SEARCH RESULTS DROPDOWN */}
                    {showDropdown && rider.name.length > 0 && filteredRiders.length > 0 && (
                        <View style={[styles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            {filteredRiders.map((item: any, index: number) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.dropdownItem}
                                    onPress={() => handleSelectRider(item)}
                                >
                                    <View>
                                        <Text style={[styles.drName, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={[styles.drSub, { color: colors.subText }]}>{item.phone} • {item.vehicleNo}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* PHONE FIELD (Always visible/editable) */}
                    <View style={styles.inputGroup}>
                        <Ionicons name="call-outline" size={20} color={colors.subText} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Phone Number"
                            value={rider.phone}
                            keyboardType="phone-pad"
                            placeholderTextColor={colors.subText}
                            onChangeText={(txt) => setRider({ ...rider, phone: txt })}
                        />
                    </View>

                    {/* VEHICLE FIELD (Always visible/editable) */}
                    <View style={styles.inputGroup}>
                        <Ionicons name="car-outline" size={20} color={colors.subText} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Vehicle/Bike Plate No."
                            value={rider.vehicleNo}
                            placeholderTextColor={colors.subText}
                            onChangeText={(txt) => setRider({ ...rider, vehicleNo: txt })}
                        />
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text style={{ color: colors.subText }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onConfirm(rider)}
                            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                        >
                            <Text style={styles.confirmText}>Confirm Dispatch</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalBox: { borderRadius: 25, padding: 24, elevation: 10 },
    title: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingHorizontal: 8,
    },
    input: { flex: 1, height: 45, fontSize: 16 },
    icon: { marginRight: 12 },

    // Dropdown Styles
    dropdown: {
        maxHeight: 150,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
        overflow: 'hidden',
    },
    dropdownItem: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    drName: { fontWeight: '700', fontSize: 14 },
    drSub: { fontSize: 12 },

    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 10 },
    cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
    confirmBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
    confirmText: { color: '#fff', fontWeight: '700' },
});

export default RiderAssignmentModal;