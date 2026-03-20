import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../models/navigationTypes';
import { useSettings } from '../context/SettingsContext';
import { Theme } from '../utils/theme';
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRequestOTPMutation } from '../services/authApi';


type Props = NativeStackScreenProps<AuthStackParamList, 'forgetPass'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
    const [requestOtp, { isLoading }] = useRequestOTPMutation()
    const handleSubmit = async () => {
        if (!input) {
            setMessage({ text: "Please enter your email or phone number", type: "error" });
            return;
        }

        try {
            // Call your API here
            await requestOtp({ phone_number: input }).unwrap();
            setMessage({ text: "OTP sent! Check your email/phone.", type: "success" });

            // Optionally navigate to OTP screen
            navigation.navigate('activation', { emailOrPhone: input });

        } catch (err: any) {
            setMessage({ text: err.message || "Something went wrong", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Text style={[styles.title, { color: theme.text }]}>Forgot Password</Text>

            <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                placeholder="Email or Phone Number"
                placeholderTextColor={theme.subText}
                value={input}
                onChangeText={setInput}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            {message && <Text style={[styles.message, { color: message.type === "error" ? "#FF4D4F" : "#52C41A" }]}>{message.text}</Text>}

            <TouchableOpacity
                style={[styles.button, { backgroundColor: Theme.primary }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 20 },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
    input: { padding: 14, borderRadius: 5, borderWidth: 1, marginBottom: 16 },
    button: { padding: 16, borderRadius: 5, alignItems: "center" },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    message: { textAlign: "center", marginBottom: 12, fontWeight: "bold" },
});

export default ForgotPasswordScreen;