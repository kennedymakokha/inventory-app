import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';

const ResetPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    try {
      await axios.post('http://<YOUR_SERVER>/api/auth/reset-password', {
        email,
      });
      Alert.alert('Success', 'Reset link sent to your email');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Error', 'Could not send reset link');
    }
  };

  return (
    <View className="flex-1 justify-center px-5">
      <Text className="text-2xl font-bold text-center mb-6">Reset Password</Text>

      <TextInput
        className="h-10 border border-gray-400 rounded px-3 mb-6"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        onPress={handleReset}
        className="bg-blue-500 py-3 rounded"
      >
        <Text className="text-white text-center font-semibold">Send Reset Link</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ResetPasswordScreen;
