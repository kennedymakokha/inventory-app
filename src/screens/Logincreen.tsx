import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Input, { InputContainer } from '../components/Input';
import { authorizedFetch } from '../middleware/auth.middleware';

import Button from '../components/Button';
import { useAuthContext } from '../context/authContext';
import { User } from '../../models';

const LoginScreen = ({ navigation }: any) => {
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [loading, setLoading] = useState(false)
    const [item, setItem] = useState({ phone_number: "0700000000", password: 'makokha1' });
    const { token, login } = useAuthContext();
    const handleChange = (key: keyof User, value: string) => {
        setMsg({ msg: "", state: "" });

        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleLogin = async () => {
        try {
            setLoading(true)
            const res = await authorizedFetch(`http://185.113.249.137:5000/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify(item),
            });
            await login(res.token)

            await AsyncStorage.setItem('userId', res.user._id);
            await AsyncStorage.setItem('user', res.user);
            setLoading(false)
            navigation.navigate('Products');
        } catch (err) {
            setLoading(false)
            Alert.alert('Login Failed', 'Invalid credentials');
        }
    };

    return (
        <View className="flex-1 justify-center items-center px-5 bg-secondary-900">
            <View className="sm:flex-1 flex sm:border  border-white sm:rounded  rounded-bl-[40%] sm:px-10 size-full items-center justify-center  sm:size-1/2">
                <View className="items-center justify-center">
                    <Image
                        className="w-60 h-60"
                        source={require('./../assets/logo.png')}
                        resizeMode="cover" // or 'contain', 'stretch'
                    />
                </View>
                <Input
                    label="Phone Number"
                    placeholder="Phone nunber"
                    value={item.phone_number}
                    onChangeText={(text: string) => handleChange("phone_number", text)}
                    keyboardType="numeric"
                />
                <Input
                    label="Password"
                    placeholder="Password"
                    value={item.password}
                    onChangeText={(text: string) => handleChange("password", text)}
                    keyboardType="password"
                />
                <Button handleclick={handleLogin} loading={loading} title="Login" />
                <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')} >
                    <Text className="text-center text-secondary-100">Forgot Password?</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LoginScreen;
