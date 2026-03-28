import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useTheme } from "../context/themeContext"; // Using your main theme context
import { useVerifyMutation } from "../services/authApi";
import Ionicons from 'react-native-vector-icons/Ionicons';

type AuthStackParamList = {
    activation: { emailOrPhone: string };
    resetPassword: { emailOrPhone: string; otp: string };
};

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, "activation">;
    route: RouteProp<AuthStackParamList, "activation">;
};

const OTPActivationScreen: React.FC<Props> = ({ navigation, route }) => {
    const { emailOrPhone } = route.params;
    const { colors, isDarkMode } = useTheme();

    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(30);
    const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

    const [verifyOTP, { isLoading }] = useVerifyMutation();

    // Resend Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async () => {
        if (otp.length < 4) {
            setMessage({ text: "Please enter the complete code", type: "error" });
            return;
        }

        try {
            await verifyOTP({
                phone_number: emailOrPhone,
                code: otp
            }).unwrap();

            navigation.navigate("resetPassword", { emailOrPhone, otp });
        } catch (error: any) {
            setMessage({
                text: error?.data?.message || "Invalid verification code",
                type: "error"
            });
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        try {
            // TODO: call resend endpoint
            setTimer(30);
            setMessage({ text: "A new code has been sent!", type: "success" });
        } catch {
            setMessage({ text: "Failed to resend. Try again.", type: "error" });
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.inner}>
                {/* ICON & HEADER */}
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="shield-checkmark-outline" size={40} color={colors.primary} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Verification Code</Text>
                
                <Text style={[styles.subtitle, { color: colors.subText }]}>
                    We've sent a 6-digit code to{"\n"}
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{emailOrPhone}</Text>
                </Text>

                {/* OTP INPUT BOXES (Styled via TextInput letterSpacing) */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={[
                            styles.otpInput,
                            { 
                                backgroundColor: colors.card, 
                                color: colors.text, 
                                borderColor: message?.type === 'error' ? colors.danger : colors.border 
                            }
                        ]}
                        placeholder="000000"
                        placeholderTextColor={isDarkMode ? "#333" : "#ccc"}
                        keyboardType="number-pad"
                        value={otp}
                        onChangeText={(text) => {
                            setOtp(text);
                            if(message) setMessage(null);
                        }}
                        maxLength={6}
                        autoFocus
                        selectionColor={colors.primary}
                    />
                </View>

                {message && (
                    <View style={[styles.messageBox, { backgroundColor: message.type === 'error' ? colors.danger + '10' : '#22c55e10' }]}>
                        <Ionicons 
                            name={message.type === 'error' ? "alert-circle" : "checkmark-circle"} 
                            size={18} 
                            color={message.type === 'error' ? colors.danger : "#22c55e"} 
                        />
                        <Text style={[styles.messageText, { color: message.type === 'error' ? colors.danger : "#22c55e" }]}>
                            {message.text}
                        </Text>
                    </View>
                )}

                {/* VERIFY BUTTON */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleVerify}
                    disabled={isLoading || otp.length < 4}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify & Proceed</Text>
                    )}
                </TouchableOpacity>

                {/* RESEND LOGIC */}
                <View style={styles.resendContainer}>
                    <Text style={[styles.resendLabel, { color: colors.subText }]}>
                        Didn't receive the code?
                    </Text>
                    <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                        <Text style={[
                            styles.resendLink, 
                            { color: timer > 0 ? colors.subText : colors.primary }
                        ]}>
                            {timer > 0 ? `Resend in ${timer}s` : "Resend Now"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        padding: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 35,
    },
    inputWrapper: {
        width: '100%',
        marginBottom: 20,
    },
    otpInput: {
        height: 65,
        borderWidth: 1.5,
        borderRadius: 16,
        fontSize: 28,
        textAlign: "center",
        letterSpacing: 15,
        fontWeight: 'bold',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 2 }
        })
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
        gap: 8
    },
    messageText: {
        fontWeight: "600",
        fontSize: 13,
    },
    button: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 16,
    },
    resendContainer: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 5
    },
    resendLabel: {
        fontSize: 14,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: "800",
    }
});

export default OTPActivationScreen;