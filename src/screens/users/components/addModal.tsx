import { View, Text, Modal } from "react-native";
import React from "react";
import { InputContainer } from "../../../components/Input";
import Toast from "../../../components/Toast";
import Button from "../../../components/Button";
import { Theme } from "../../../utils/theme";
import { Picker } from "@react-native-picker/picker";

const AddUserModal = ({
  modalVisible,
  setModalVisible,
  onClose,
  isDarkMode,
  msg,
  setMsg,
  item,
  setItem,
  PostLocally,
}: any) => {

  const theme = isDarkMode ? Theme.dark : Theme.light;

  const roles = [
    { label: "Admin", value: "admin" },
    // { label: "Manager", value: "manager" },
    { label: "Sales", value: "sales" },
    // { label: "User", value: "user" },
  ];

  const handleChange = (key: string, value: string) => {
    setMsg({ msg: "", state: "" });

    setItem((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{9,15}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = () => {
    if (!item.name) {
      return setMsg({ msg: "Name is required", state: "error" });
    }

    // if (item.phone_number && !validatePhone(item.phone_number)) {
    //   return setMsg({ msg: "Invalid phone number", state: "error" });
    // }

    PostLocally();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 px-10 bg-secondary-900 justify-center">

        <Text className="text-2xl font-bold text-center uppercase text-green-500 mb-6">
          {item?.user_id ? "Update User" : "Add New User"}
        </Text>

        <InputContainer
          label="Full Name"
          placeholder="Enter full name"
          value={item.name}
          onChangeText={(text: string) => handleChange("name", text)}
        />

        <InputContainer
          label="Phone Number"
          placeholder="e.g 712345678"
          value={item.phone_number}
          keyboardType="phone-pad"
          onChangeText={(text: string) => handleChange("phone_number", text)}
        />

        <InputContainer
          label="Email"
          placeholder="Enter email"
          value={item.email}
          keyboardType="email-address"
          onChangeText={(text: string) => handleChange("email", text)}
        />

        {/* ROLE DROPDOWN */}

        <Text className="text-white mb-1 mt-3">Role</Text>

        <View className="bg-gray-800 rounded-lg mb-4">
          <Picker
            selectedValue={item.role}
            onValueChange={(value) => handleChange("role", value)}
            dropdownIconColor="white"
          >
            <Picker.Item label="Select role" value="" />
            {roles.map((role) => (
              <Picker.Item
                key={role.value}
                label={role.label}
                value={role.value}
              />
            ))}
          </Picker>
        </View>

        {msg.msg && (
          <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />
        )}

        {/* BUTTONS */}

        <View className="flex-row w-full mt-4">

          <View className="w-1/2 px-2">
            <Button
              handleclick={onClose}
              outline
              loading={false}
              title="Cancel"
            />
          </View>

          <View className="w-1/2 px-2">
            <Button
              handleclick={handleSubmit}
              loading={false}
              title={item?.user_id ? "Update" : "Submit"}
            />
          </View>

        </View>

      </View>
    </Modal>
  );
};

export default AddUserModal;