import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Platform, StyleSheet, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, CameraType } from 'react-native-camera-kit';
import { InputContainer, TextArea } from '../../../components/Input';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Theme } from '../../../utils/theme';

const RestockModal = ({
    restockQty,
    handleRestock,
    setRestockQty,
    restockModalVisible,
    selectedProduct,
    isDarkMode
}: any) => {

    const theme = isDarkMode ? Theme.dark : Theme.light;
   
    return (
       <Modal
  visible={selectedProduct !== null && restockModalVisible}
  transparent
  animationType="fade"
>
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)'
  }}>
    <View style={{
      width: '80%',
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 20
    }}>
      <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 10 }}>
        Restock {selectedProduct?.product_name}
      </Text>

      <TextInput
        placeholder="Enter quantity"
        placeholderTextColor={theme.subText}
        keyboardType="numeric"
        value={restockQty}
        onChangeText={setRestockQty}
        style={{
          backgroundColor: theme.inputBg,
          color: theme.text,
          padding: 10,
          borderRadius: 10,
          marginBottom: 20
        }}
      />

      <TouchableOpacity
        onPress={handleRestock}
        style={{
          backgroundColor: Theme.success,
          padding: 12,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>
          Confirm Restock
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    );
};



export default RestockModal;