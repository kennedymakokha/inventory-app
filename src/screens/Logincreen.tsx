import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Input, { InputContainer } from '../components/Input';
import { authorizedFetch } from '../middleware/auth.middleware';

import Button from '../components/Button';
import { useAuthContext } from '../context/authContext';
import { User } from '../../models';
import { setCredentials } from '../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../services/authApi';

const LoginScreen = ({ navigation }: any) => {
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [loading, setLoading] = useState(false)
    const [progress, setprogress] = useState("")
    const [item, setItem] = useState({ phone_number: "0727270677", password: '+254727270677' });
    const [loginUser, { isLoading, error }] = useLoginMutation();
    const dispatch = useDispatch()
    const { login } = useAuthContext();
    const handleChange = (key: keyof User, value: string) => {
        setMsg({ msg: "", state: "" });

        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };


    const handleLogin = async (e?: any) => {
        try {
            setprogress("starting")
            setMsg({ msg: "", state: "" });

            if (!item.phone_number || !item.password) {
                setMsg({ msg: "Both fields are required", state: "error" });
                return;
            }
            setLoading(true)

            // const data = await loginUser(item).unwrap()
            const data = {
                "ok": true,
                "message": "Logged in",
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWEwMTVkNzZjMGExYzcyMjMwNmFhZWIiLCJ1c2VybmFtZSI6Ik1rb2xvbmdvbG8gU3VwcGxpZXMncyBBZG1pbiIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiJNa29sb25nb2xvIFN1cHBsaWVzJ3MgQWRtaW4iLCJpYXQiOjE3NzI0MjEzNjgsImV4cCI6MTc3MzAyNjE2OH0.vuTlhHjhDfKtkUhk1Cfkl-R49FhgVKaqpphA5vxDseE",
                "exp": 1773026168,
                "user": {
                    "_id": "69a015d76c0a1c722306aaeb",
                    "phone_number": "0727270677",
                    "name": "Mkolongolo Supplies's Admin",
                    "business": {
                        "_id": "69a015d66c0a1c722306aae9",
                        "business_name": "Mkolongolo Supplies",
                        "postal_address": "P.O BOX 123 - NAIROBI",
                        "phone_number": "+254727270677",
                        "contact_number": "0727270677",
                        "kra_pin": "P051234567X",
                        "api_key": "1234567ss8bcer6"
                    },
                    "role": "admin",
                    "activated": true,
                    "password": "$2b$10$O1aMv1dXtn7KlJk28ybWdeDjDPG9cmgo7IyMIWxC1TTam0rBdh7Hm"
                }
            }

            if (data.ok === true) {
                setprogress("Data truei")
                dispatch(setCredentials({ ...data }))
                await AsyncStorage.setItem("accessToken", data.token);
                await AsyncStorage.setItem('userId', data.user._id);
                if (data?.exp) {

                    await AsyncStorage.setItem("tokenExpiry", data.exp.toString());
                    await login(data.token);
                }
                setLoading(false)
                setMsg({ msg: `Login successful! Redirecting...`, state: "success" })

            } else {
                setLoading(false)
                setprogress("Data false")
            }

        } catch (error: any) {
            console.error(error);
            setMsg({ msg: error.message || error.data || "Error Occured try again 😧😧😧 !!!", state: "error" });

        } finally {

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
                <Text className='text-white'>{progress}</Text>
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
