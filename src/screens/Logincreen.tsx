import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuthContext } from '../context/authContext';
import { User } from '../../models';
import { setCredentials } from '../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../services/authApi';
import { useUser } from '../context/UserContext';
import { useBusiness } from '../context/BusinessContext';
import { useTheme } from '../context/themeContext';
import Toast from '../components/Toast';

const LoginScreen = ({ navigation }: any) => {
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [loading, setLoading] = useState(false);

    const [item, setItem] = useState({ phone_number: "", password: '' });

    const [loginUser] = useLoginMutation();
    const dispatch = useDispatch();

    const { login } = useAuthContext();
    const { setUser } = useUser();
    const { refreshTheme } = useTheme();
    const { updateBusiness } = useBusiness();

    const handleChange = (key: keyof User, value: string) => {
        setMsg({ msg: "", state: "" });

        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleLogin = async () => {
        try {
            setMsg({ msg: "", state: "" });

            if (!item.phone_number || !item.password) {
                setMsg({ msg: "Both fields are required", state: "error" });
                return;
            }

            setLoading(true);

            const data = await loginUser(item).unwrap();

            if (data.ok) {
                dispatch(setCredentials({ ...data }));

                await AsyncStorage.setItem("accessToken", data.token);
                await AsyncStorage.setItem("userId", data.user._id);

                if (data.exp) {
                    await AsyncStorage.setItem("tokenExpiry", data.exp.toString());

                    await login(data.token);
                    setUser(data.user);
                    updateBusiness(data.user.business);

                    // ✅ Set default theme ONLY (status engine will override if needed)
                    if (data.user.business) {
                        const { primary_color, secondary_color } = data.user.business;

                        await AsyncStorage.multiSet([
                            ["primary_color", primary_color ?? "#3c58a8"],
                            ["secondary_color", secondary_color ?? "#fff"]
                        ]);

                        await refreshTheme();
                    }
                }

                setMsg({ msg: "Login successful! Redirecting...", state: "success" });
            } else {
                setMsg({ msg: "Login failed", state: "error" });
            }

            setLoading(false);
        } catch (error: any) {
            console.error(error);
            setLoading(false);

            setMsg({
                msg: error.message || error.data || "Error occurred, try again",
                state: "error",
            });
        }
    };

    return (
        <View className="flex-1 justify-center items-center px-5 bg-secondary-900">
            <View className="sm:flex-1 flex sm:border border-white sm:rounded rounded-bl-[40%] sm:px-10 size-full items-center justify-center sm:size-1/2">

                <Image
                    className="w-60 h-60"
                    source={require('./../assets/logo.png')}
                    resizeMode="cover"
                />

                <Input
                    label="Phone Number"
                    placeholder="Phone number"
                    value={item.phone_number}
                    onChangeText={(text: string) => handleChange("phone_number", text)}
                    keyboardType="numeric"
                />

                <Input
                    label="Password"
                    placeholder="Password"
                    value={item.password}
                    onChangeText={(text: string) => handleChange("password", text)}
                />

                <Button handleclick={handleLogin} loading={loading} title="Login" />

                <TouchableOpacity onPress={() => navigation.navigate('forgetPass')}>
                    <Text className="text-center text-secondary-100">
                        Forgot Password?
                    </Text>
                </TouchableOpacity>

                {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}
            </View>
        </View>
    );
};

export default LoginScreen;