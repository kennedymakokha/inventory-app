import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../models/navigationTypes';
import { useSettings } from '../context/SettingsContext';
import { Theme } from '../utils/theme';
import React, { useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform,
    SafeAreaView 
} from "react-native";
import { useRequestOTPMutation } from '../services/authApi';
import  Ionicons  from 'react-native-vector-icons/Ionicons'; // For the back button

type Props = NativeStackScreenProps<AuthStackParamList, 'forgetPass'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;

    const [input, setInput] = useState("");
    const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
    const [requestOtp, { isLoading }] = useRequestOTPMutation();

    const handleSubmit = async () => {
        if (!input) {
            setMessage({ text: "Identification required to proceed.", type: "error" });
            return;
        }

        try {
            await requestOtp({ phone_number: input }).unwrap();
            setMessage({ text: "Security code dispatched successfully.", type: "success" });
            
            // Short delay so they can see the success message
            setTimeout(() => {
                navigation.navigate('activation', { emailOrPhone: input });
            }, 1500);

        } catch (err: any) {
            setMessage({ text: err.data?.message || "Verification failed. Please try again.", type: "error" });
        }
    };

    return (
        <View  style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
            
                style={{ marginTop: 24, flex: 1, padding: 24, justifyContent: 'center' }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* BACK BUTTON */}
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                    <Text style={[styles.backText, { color: theme.text }]}>Back to Login</Text>
                </TouchableOpacity>

                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="shield-checkmark-outline" size={40} color={Theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Account Recovery</Text>
                    <Text style={[styles.subtitle, { color: theme.subText }]}>
                        Enter your registered phone or email to receive a secure access code.
                    </Text>
                </View>

                {/* FORM CARD */}
                <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Staff Identification</Text>
                    <TextInput
                        style={[
                            styles.input, 
                            { 
                                backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9', 
                                color: theme.text, 
                                borderColor: theme.border 
                            }
                        ]}
                        placeholder="Phone or Email"
                        placeholderTextColor={theme.subText}
                        value={input}
                        onChangeText={(text) => {
                            setInput(text);
                            if(message) setMessage(null);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {message && (
                        <View style={[styles.messageBox, { backgroundColor: message.type === 'error' ? '#FEF2F2' : '#F0FDF4' }]}>
                           <Text style={[styles.message, { color: message.type === "error" ? "#B91C1C" : "#15803D" }]}>
                                {message.text}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: Theme.primary }]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Request Security Code</Text>
                        )}
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.footerInfo}>Terminal ID: #882-POS</Text>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        top: 20,
        left: 24,
    },
    backText: { marginLeft: 8, fontWeight: '600', fontSize: 16 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    title: { fontSize: 28, fontWeight: "800", marginBottom: 10, textAlign: "center" },
    subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
    card: {
        padding: 24,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        fontSize: 16,
        marginBottom: 10
    },
    button: { 
        padding: 18, 
        borderRadius: 12, 
        alignItems: "center",
        marginTop: 10
    },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    messageBox: { padding: 12, borderRadius: 8, marginBottom: 15 },
    message: { textAlign: "center", fontSize: 13, fontWeight: "600" },
    footerInfo: { textAlign: 'center', marginTop: 40, color: '#94A3B8', fontSize: 12 }
});

export default ForgotPasswordScreen;