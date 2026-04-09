import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Alert,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import RiderAssignmentModal from './RiderAssignmentModal';
import { useTheme } from '../context/themeContext';
import { dispatchDelivery, getPendingDeliveries } from '../services/closeOpen.service';
import { useFocusEffect } from '@react-navigation/native';
import PageHeader from '../../src/components/pageHeader';
import { SearchBar } from 'react-native-screens';
import { useSelector } from 'react-redux';
import { RiderDetails } from '../../models';
const DispatchScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { user } = useSelector((state: any) => state.auth);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    // Mock Data for Pending Deliveries
    const [rider, setRider] = useState<RiderDetails>({ name: '', phone: '', vehicleNo: '' });
    useEffect
        (() => {
            getPendingDeliveries().then((data) => {
                setDeliveries(data);
            }).catch((err) => {
                console.error("Error fetching deliveries:", err);
            });

        }
            , []);
    const handleDispatchPress = (order: any) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    const onConfirmDispatch = async (rider: RiderDetails) => {
        try {
            await dispatchDelivery({
                delivery_id: selectedOrder.delivery_id,
                rider_description: rider.vehicleNo,
                rider_phoneNumber: rider.phone,
                dispachedBy: user._id,
                rider_name: rider.name,
            })

            setModalVisible(false);
        } catch (error) {
            console.log(error)
        }
    };

    const renderDeliveryItem = ({ item }: any) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.orderId, { color: colors.subText }]}>ORDER #{item.id}</Text>
                    <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>PENDING{item.distatus === 1 ? "Dispatched" : "pending still "}</Text>
                </View>
            </View>

            <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={[styles.addressText, { color: colors.subText }]}>{item.address}</Text>
            </View>

            <TouchableOpacity
                style={[styles.dispatchBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleDispatchPress(item)}
            >
                <Ionicons name="bicycle-outline" size={20} color="#fff" />
                <Text style={styles.dispatchBtnText}>Assign Rider</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <PageHeader />
            <FlatList
                data={deliveries}
                keyExtractor={(item) => item.id}
                renderItem={renderDeliveryItem}
                contentContainerStyle={styles.listPadding}
            // ListHeaderComponent={
            //     <Text style={[styles.listTitle, { color: colors.text }]}>Pending Dispatch</Text>
            // }
            />

            <RiderAssignmentModal
                isVisible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={onConfirmDispatch}
                rider={rider} setRider={setRider}
            />
        </View>
    );
};
const styles = StyleSheet.create({
    listPadding: { padding: 16 },
    listTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
    card: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    orderId: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    customerName: { fontSize: 18, fontWeight: '800' },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    addressText: { fontSize: 14 },
    dispatchBtn: {
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12, alignSelf: 'flex-start',

    },

    headerContent: { flexDirection: 'row', alignItems: 'center' },

    fabBack: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100,
        left: 16,
        zIndex: 10,
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },

    dispatchBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    // Modal Styles
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalBox: { borderRadius: 25, padding: 24, elevation: 10 },
    title: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    input: { flex: 1, height: 45, fontSize: 16 },
    icon: { marginRight: 12 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 10 },
    confirmBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
    confirmText: { color: '#fff', fontWeight: '700' },
});

export default DispatchScreen;