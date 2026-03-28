import { View, Text, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import React from "react";
import { InputContainer } from "../../../components/Input";
import Toast from "../../../components/Toast";
import Button from "../../../components/Button";
import { Picker } from "@react-native-picker/picker";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "../../../context/themeContext";

const AddUserModal = ({
  modalVisible,
  setModalVisible,
  onClose,
  msg,
  setMsg,
  item,
  setItem,
  PostLocally,
  loading
}: any) => {
  const { colors, isDarkMode } = useTheme();

  const roles = [
    { label: "Admin", value: "admin" },
    { label: "Sales", value: "sales" },
  ];

  const handleChange = (key: string, value: string) => {
    setMsg({ msg: "", state: "" });
    setItem((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!item.name) return setMsg({ msg: "Name is required", state: "error" });
    if (!item.role) return setMsg({ msg: "Please select a role", state: "error" });
    PostLocally();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={onClose} 
          style={styles.overlay}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* DRAG HANDLE INDICATOR */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {item?.user_id ? "Edit Staff Member" : "Add Staff Member"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={28} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <InputContainer
                label="Full Name"
                placeholder="Enter full name"
                value={item.name}
                onChangeText={(text: string) => handleChange("name", text)}
              />

              <InputContainer
                label="Phone Number"
                placeholder="712 345 678"
                value={item.phone_number}
                keyboardType="phone-pad"
                onChangeText={(text: string) => handleChange("phone_number", text)}
              />

              <InputContainer
                label="Email Address"
                placeholder="staff@business.com"
                value={item.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(text: string) => handleChange("email", text)}
              />

              <Text style={[styles.label, { color: colors.text }]}>Assigned Role</Text>
              <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6', borderColor: colors.border }]}>
                <Picker
                  selectedValue={item.role}
                  onValueChange={(value) => handleChange("role", value)}
                  dropdownIconColor={colors.text}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label="Select a role..." value="" color={colors.subText} />
                  {roles.map((role) => (
                    <Picker.Item key={role.value} label={role.label} value={role.value} />
                  ))}
                </Picker>
              </View>

              {msg.msg && (
                <View style={{ marginTop: 10 }}>
                   <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />
                </View>
              )}

              <View style={styles.buttonRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Button
                    handleclick={onClose}
                    outline
                    title="Cancel"
                  />
                </View>
                <View style={{ flex: 1, paddingLeft: 8 }}>
                  <Button
                    handleclick={handleSubmit}
                    loading={loading}
                    title={item?.user_id ? "Update User" : "Create User"}
                  />
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '85%',
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
  }
});

export default AddUserModal;