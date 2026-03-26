import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Animated } from 'react-native';
import { NativeModules } from 'react-native';

const { Kiosk } = NativeModules;

export default function LockScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const scale = new Animated.Value(1);
 const { colors } = useTheme();
  const animate = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.1, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const unlock = () => {
    if (pin === '2468') {
      Kiosk.unlock();
    } else {
      setError('Invalid PIN');
      animate();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
      
      {/* Animated Logo */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image
           source={require('./../assets/logo.png')}
          style={{ width: 150, height: 150 }}
        />
      </Animated.View>

      <Text style={{ color: '#fff', fontSize: 20, marginTop: 20 }}>
        Device Locked
      </Text>

      {/* PIN Input */}
      <TextInput
        value={pin}
        onChangeText={setPin}
        placeholder="Enter PIN"
        secureTextEntry
        keyboardType="numeric"
        style={{
          backgroundColor: '#fff',
          marginTop: 20,
          padding: 12,
          width: '60%',
          borderRadius: 10,
          textAlign: 'center'
        }}
      />

      {/* Unlock Button */}
      <TouchableOpacity
        onPress={unlock}
        style={{
          backgroundColor: colors.primaryDark,
          marginTop: 15,
          padding: 12,
          borderRadius: 10,
          width: '60%',
          alignItems: 'center'
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>Unlock</Text>
      </TouchableOpacity>

      {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}

    </View>
  );
}