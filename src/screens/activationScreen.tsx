import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useSettings } from "../context/SettingsContext";
import { Theme } from "../utils/theme";
import { useVerifyMutation } from "../services/authApi";

type AuthStackParamList = {
    activation: { emailOrPhone: string };
    resetPassword: { emailOrPhone: string; otp: string };
};

type OTPActivationScreenNavigationProp = NativeStackNavigationProp<
    AuthStackParamList,
    "activation"
>;

type OTPActivationScreenRouteProp = RouteProp<
    AuthStackParamList,
    "activation"
>;

type Props = {
    navigation: OTPActivationScreenNavigationProp;
    route: OTPActivationScreenRouteProp;
};

const OTPActivationScreen: React.FC<Props> = ({ navigation, route }) => {
    const { emailOrPhone } = route.params;

    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;

    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

    const [verifyOTP, { isLoading }] = useVerifyMutation();

    const handleVerify = async () => {
        if (otp.length < 4) {
            setMessage({ text: "Enter a valid OTP", type: "error" });
            return;
        }

        try {
            await verifyOTP({
                phone_number: emailOrPhone,
                code: otp
            }).unwrap();

            setMessage({ text: "OTP verified!", type: "success" });

            navigation.navigate("resetPassword", {
                emailOrPhone,
                otp
            });

        } catch (error: any) {
            setMessage({
                text: error?.data?.message || "Invalid OTP",
                type: "error"
            });
        }
    };

    const handleResend = async () => {
        try {
            // TODO: call resend endpoint
            setMessage({ text: "OTP resent successfully!", type: "success" });
        } catch {
            setMessage({ text: "Failed to resend OTP", type: "error" });
        }
    };

    return (
        <KeyboardAvoidingView
            style={{
                flex: 1,
                backgroundColor: theme.background,
                padding: 20,
                justifyContent: "center"
            }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >

            <Text
                style={{
                    color: theme.text,
                    fontSize: 28,
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: 10
                }}
            >
                Enter OTP
            </Text>

            <Text
                style={{
                    color: theme.subText,
                    textAlign: "center",
                    marginBottom: 25
                }}
            >
                Enter the verification code sent to {emailOrPhone}
            </Text>

            <TextInput
                style={{
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 22,
                    textAlign: "center",
                    letterSpacing: 10,
                    marginBottom: 16
                }}
                placeholder="000000"
                placeholderTextColor={theme.subText}
                keyboardType="numeric"
                value={otp}
                onChangeText={setOtp}
                maxLength={6}
            />

            {message && (
                <Text
                    style={{
                        color: message.type === "error" ? "#ef4444" : "#22c55e",
                        textAlign: "center",
                        marginBottom: 15,
                        fontWeight: "bold"
                    }}
                >
                    {message.text}
                </Text>
            )}

            <TouchableOpacity
                style={{
                    backgroundColor: Theme.primary,
                    padding: 16,
                    borderRadius: 12,
                    alignItems: "center"
                }}
                onPress={handleVerify}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text
                        style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 16
                        }}
                    >
                        Verify OTP
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleResend}
                disabled={isLoading}
                style={{ marginTop: 20 }}
            >
                <Text
                    style={{
                        color: Theme.primary,
                        fontWeight: "bold",
                        textAlign: "center"
                    }}
                >
                    Resend OTP
                </Text>
            </TouchableOpacity>

        </KeyboardAvoidingView>
    );
};

export default OTPActivationScreen;