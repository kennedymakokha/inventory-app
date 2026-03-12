import React, { useState } from "react";
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

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../models/navigationTypes";
import { useSettings } from "../context/SettingsContext";
import { Theme } from "../utils/theme";
import { useResetPasswordMutation } from "../services/authApi";


type Props = NativeStackScreenProps<AuthStackParamList, "resetPassword">;

const ResetPasswordScreen = ({ navigation, route }: Props) => {
    const { emailOrPhone, otp } = route.params;

    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
    const [resetPass, { isLoading }] = useResetPasswordMutation()
    const handleReset = async () => {
        if (!password || !confirmPassword) {
            setMsg({ text: "All fields are required", type: "error" });
            return;
        }

        if (password.length < 6) {
            setMsg({ text: "Password must be at least 6 characters", type: "error" });
            return;
        }

        if (password !== confirmPassword) {
            setMsg({ text: "Passwords do not match", type: "error" });
            return;
        }

        setLoading(true);

        try {
            // call API here
            await resetPass({ phone_number: emailOrPhone, otp, newPassword: password }).unwrap();

            setMsg({ text: "Password reset successful!", type: "success" });

            setTimeout(() => {
                navigation.navigate("login");
            }, 1500);

        } catch (error: any) {
            setMsg({
                text: error?.message || "Password reset failed",
                type: "error"
            });
        }

        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >

            <Text style={[styles.title, { color: theme.text }]}>
                Reset Password
            </Text>

            <Text style={{ color: theme.subText, textAlign: "center", marginBottom: 20 }}>
                Enter your new password
            </Text>

            <TextInput
                style={[
                    styles.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }
                ]}
                placeholder="New Password"
                placeholderTextColor={theme.subText}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TextInput
                style={[
                    styles.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }
                ]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.subText}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            {msg && (
                <Text
                    style={{
                        color: msg.type === "error" ? "#ef4444" : "#22c55e",
                        textAlign: "center",
                        marginBottom: 10
                    }}
                >
                    {msg.text}
                </Text>
            )}

            <TouchableOpacity
                style={[styles.button, { backgroundColor: Theme.primary }]}
                onPress={handleReset}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                )}
            </TouchableOpacity>

        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10
    },
    input: {
        borderWidth: 1,
        padding: 14,
        borderRadius: 12,
        marginBottom: 15,
        fontSize: 16
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center"
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16
    }
});

export default ResetPasswordScreen;