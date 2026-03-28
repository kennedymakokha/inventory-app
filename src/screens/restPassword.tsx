import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    SafeAreaView
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
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
    const [msg, setMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
    const [resetPass, { isLoading }] = useResetPasswordMutation();

    const handleReset = async () => {
        if (!password || !confirmPassword) {
            setMsg({ text: "Please fill in all security fields.", type: "error" });
            return;
        }
        if (password.length < 6) {
            setMsg({ text: "Security PIN must be at least 6 characters.", type: "error" });
            return;
        }
        if (password !== confirmPassword) {
            setMsg({ text: "Credentials do not match.", type: "error" });
            return;
        }

        try {
            await resetPass({ phone_number: emailOrPhone, otp, newPassword: password }).unwrap();
            setMsg({ text: "System access updated successfully!", type: "success" });

            setTimeout(() => {
                navigation.navigate("login");
            }, 1500);
        } catch (error: any) {
            setMsg({
                text: error?.data?.message || "Internal system error. Try again.",
                type: "error"
            });
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                style={styles.innerContainer}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="key-outline" size={40} color={Theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>New Credentials</Text>
                    <Text style={[styles.subtitle, { color: theme.subText }]}>
                        Update your terminal access password for {emailOrPhone}
                    </Text>
                </View>

                {/* FORM CARD */}
                <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>

                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: theme.text, borderColor: theme.border }]}
                            placeholder="••••••••"
                            placeholderTextColor={theme.subText}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: theme.text }]}>Confirm New Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', color: theme.text, borderColor: theme.border }]}
                            placeholder="••••••••"
                            placeholderTextColor={theme.subText}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    {msg && (
                        <View style={[styles.alert, { backgroundColor: msg.type === "error" ? "#FEF2F2" : "#F0FDF4" }]}>
                            <Text style={[styles.alertText, { color: msg.type === "error" ? "#EF4444" : "#22C55E" }]}>
                                {msg.text}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: Theme.primary }]}
                        onPress={handleReset}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Update and Login</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate("login")}
                    style={styles.cancelBtn}
                >
                    <Text style={{ color: theme.subText, fontWeight: '500' }}>Cancel Update</Text>
                </TouchableOpacity>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    innerContainer: { flex: 1, padding: 24, justifyContent: "center" },
    header: { alignItems: "center", marginBottom: 32 },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16
    },
    title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
    subtitle: { fontSize: 14, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
    card: {
        padding: 24,
        borderRadius: 20,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    inputWrapper: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: "700", marginBottom: 8, textTransform: 'uppercase' },
    input: {
        borderWidth: 1,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    alert: { padding: 12, borderRadius: 8, marginBottom: 16 },
    alertText: { textAlign: "center", fontSize: 14, fontWeight: "600" },
    button: {
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8
    },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cancelBtn: { marginTop: 24, alignItems: "center" }
});

export default ResetPasswordScreen;