import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    StyleSheet,
    TextInput, // Standard RN Component
    ActivityIndicator
} from 'react-native';
import { useLoginMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { useAuthContext } from '../context/authContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/themeContext';
import { useBusiness } from '../context/BusinessContext';
import { setCredentials } from '../features/auth/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../models';
import { useSettings } from '../context/SettingsContext';
import { Theme } from '../utils/theme';
const COLORS = {
    primary: "#2563EB",
    secondary: "#0F172A",
    text: "#374151",
    subtext: "#6B7280",
    background: "#F8FAFC",
    border: "#E2E8F0",
    white: "#FFFFFF",
    error: "#EF4444"
};

const LoginScreen = ({ navigation }: any) => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;
    const [item, setItem] = useState({ phone_number: "", password: '' });
    const [msg, setMsg] = useState({ msg: "", state: "" });
    const [loginUser, { error, isLoading: loading }] = useLoginMutation();
    const dispatch = useDispatch()
    const { login } = useAuthContext();
    const { setUser } = useUser();
    const { refreshTheme } = useTheme();
    const { business, updateBusiness } = useBusiness();


    const handleChange = (key: keyof User, value: string) => {
        setMsg({ msg: "", state: "" });

        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };


    const handleLogin = async (e?: any) => {
        try {

            setMsg({ msg: "", state: "" });

            if (!item.phone_number || !item.password) {
                setMsg({ msg: "Both fields are required", state: "error" });
                return;
            }



            const data = await loginUser(item).unwrap();

            if (data.ok) {
                // Update Redux / AsyncStorage if needed
                dispatch(setCredentials({ ...data }));
                await AsyncStorage.setItem("accessToken", data.token);
                await AsyncStorage.setItem("userId", data.user._id);

                //  Update context with logged-in user

                if (data.exp) {
                    await AsyncStorage.setItem("tokenExpiry", data.exp.toString());
                    await login(data.token);
                    setUser(data.user);
                    updateBusiness(data.user.business);
                    if (data.user.business) {
                        const { primary_color, secondary_color } = data.user.business;

                        // 1. Save the "Seeds"
                        await AsyncStorage.setItem("primary_color", primary_color ?? "#3c58a8");
                        await AsyncStorage.setItem("secondary_color", secondary_color ?? "#fff");

                        // 2. Refresh the context
                        // The Provider will now call createTheme(p, s) and update the whole UI
                        await refreshTheme();
                    }
                }
                setMsg({ msg: "Login successful! Redirecting...", state: "success" });
            } else {

                setMsg({ msg: "Login successful! Redirecting...", state: "error" });
            }
        } catch (error: any) {

            setMsg({
                msg: error.message || error.data || "Error occurred, try again ",
                state: "error",
            });
        }
    };
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* TOP BRANDING */}
                    <View style={styles.header}>
                        <View  className='bg-slate-100 rounded-full' style={styles.logoCircle}>
                            <Image
                                style={styles.logo}
                                source={require('./../assets/logo.png')}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={[styles.brandTitle, { color: theme.text }]}>POS System</Text>
                        <Text style={[styles.brandSubtitle, { color: theme.subText }]}>Enter credentials to access terminal</Text>
                    </View>

                    {/* LOGIN FORM */}
                    <View style={[styles.formCard, { backgroundColor: theme.card }]}>

                        {/* Phone Input Group */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 0712345678"
                                placeholderTextColor={theme.subText}
                                keyboardType="numeric"
                                value={item.phone_number}
                                onChangeText={(text) => handleChange("phone_number", text)}
                            />
                        </View>

                        {/* Password Input Group */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Security Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={theme.subText}
                                secureTextEntry
                                value={item.password}
                                onChangeText={(text) => handleChange("password", text)}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('forgetPass')}
                            style={styles.forgotContainer}
                        >
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.loginBtn}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.loginBtnText}>Unlock Terminal</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* FOOTER INFO */}
                    <Text style={styles.footerNote}>
                        Secure Session • End-to-End Encrypted
                    </Text>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 210,
        height: 210,
        // borderRadius: 5,
        
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginBottom: 20,
    },
    logo: {
        width: 270,
        height: 270,
    },
    brandTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.secondary,
    },
    brandSubtitle: {
        fontSize: 14,
        color: COLORS.subtext,
        marginTop: 4,
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        height: 52,
        backgroundColor: '#F1F5F9', // Slightly greyed out for "depth"
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.secondary,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    loginBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    loginBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    footerNote: {
        textAlign: 'center',
        marginTop: 30,
        color: '#94A3B8',
        fontSize: 12,
        letterSpacing: 0.5,
    }
});

export default LoginScreen;