import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Platform, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { InputContainer } from '../../../components/Input';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../context/themeContext';
import getInitials from '../../../utils/initials';

const RestockModal = ({
  restockQty,
  handleRestock,
  setRestockQty,
  selectedProduct,
  setModalVisible,
  modalVisible,
  batchNumber,
  setBatchNumber,
  expiryDate,
  setExpiryDate,
}: any) => {

  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        {/* Backdrop - Click to close */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)} 
        />
        
        <View style={[styles.bottomSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Pull Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* HEADER */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Restock Inventory</Text>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                {selectedProduct?.product_name || 'Select Product'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Icon name="close" size={24} color={colors.subText} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* QUANTITY */}
            <InputContainer
              label="Quantity to Add"
              placeholder="0"
              value={restockQty}
              keyboardType="numeric"
              onChangeText={setRestockQty}
            />

            {/* BATCH NUMBER */}
            <InputContainer
              label="Batch / Reference Number"
              placeholder="e.g. LOT-102"
              value={batchNumber}
              onChangeText={()=>setBatchNumber(getInitials(selectedProduct?.product_name || '') + '-' + Date.now())}
            />

            {/* EXPIRY DATE */}
            <Text style={[styles.fieldLabel, { color: colors.subText }]}>Expiry Date</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              style={[styles.datePickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Icon name="calendar-clock" size={20} color={colors.primary} />
              <Text style={[styles.dateText, { color: expiryDate ? colors.text : colors.subText }]}>
                {expiryDate ? expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={expiryDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* ACTION BUTTONS */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleRestock}
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.confirmBtnText}>UPDATE STOCK LEVEL</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end', // Aligns modal to bottom
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: { 
    width: '100%', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '85%', // Prevents overlapping status bar
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.5
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '900',
    letterSpacing: -0.5
  },
  closeBtn: {
    padding: 4
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600'
  },
  modalButtons: { 
    marginTop: 30, 
  },
  confirmBtn: { 
    padding: 18, 
    borderRadius: 18, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  confirmBtnText: {
    color: '#fff', 
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1
  }
});

export default RestockModal;