import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/themeContext";
import { useSelector } from "react-redux";

const fields = [
    { label: "Full Name", key: "name", icon: "person", locked: false },
    { label: "Email Address", key: "email", icon: "mail", locked: true },
    { label: "Phone Number", key: "phone_number", icon: "call", locked: false },
];

const UserProfileScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const { user } = useSelector((state: any) => state.auth);
    const { updateUser, isLoading, isUpdating } = useUser();

    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(user ?? {
        _id: "",
        name: "",
        email: "",
        phone_number: "",
    });

    useEffect(() => {
        if (user) setData(user);
    }, [user]);

    const handleChange = (key: string, value: string) => {
        setData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (user) {
            await updateUser(data);
            setIsEditing(false);
        }
    };

    const renderField = (label: string, key: string, icon: string, locked?: boolean) => (
        <View
            key={key}
            style={[
                styles.fieldCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: isEditing && locked ? 0.6 : 1
                }
            ]}
        >
            <View style={styles.fieldHeader}>
                <Ionicons name={icon} size={14} color={colors.primary} />
                <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
                {locked && <Ionicons name="lock-closed" size={12} color={colors.subText} style={{ marginLeft: 'auto' }} />}
            </View>

            {isEditing && !locked ? (
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                            color: colors.text,
                            borderColor: colors.border
                        }
                    ]}
                    value={(data as any)[key]}
                    onChangeText={(text) => handleChange(key, text)}
                    placeholder={`Enter ${label}`}
                    placeholderTextColor={colors.subText}
                />
            ) : (
                <Text style={[styles.value, { color: colors.text }]}>
                    {(data as any)[key] || "Not provided"}
                </Text>
            )}
        </View>
    );

    // if (isLoading) {
    //     return (
    //         <View style={[styles.center, { backgroundColor: colors.background }]}>
    //             <ActivityIndicator size="large" color={colors.primary} />
    //         </View>
    //     );
    // }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* AVATAR HEADER */}
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                                {data.name?.charAt(0).toUpperCase() || "U"}
                            </Text>
                        </View>
                        <Text style={[styles.userName, { color: colors.text }]}>{data.name}</Text>
                        <Text style={[styles.userRole, { color: colors.subText }]}>System Operator</Text>
                    </View>

                    {/* FIELDS */}
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Account Details</Text>
                    {fields.map(field => renderField(field.label, field.key, field.icon, field.locked))}

                    {/* ACTIONS */}
                    <View style={styles.actionContainer}>
                        {isEditing ? (
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]}
                                    onPress={() => setIsEditing(false)}
                                >
                                    <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btn, { backgroundColor: colors.primary, flex: 2 }]}
                                    onPress={handleSave}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Profile</Text>}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: colors.primary }]}
                                onPress={() => setIsEditing(true)}
                            >
                                <Ionicons name="create-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Edit Profile</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    scrollContent: { padding: 20, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    avatarText: { fontSize: 40, fontWeight: '800' },
    userName: { fontSize: 22, fontWeight: '800' },
    userRole: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    sectionTitle: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 16 },
    fieldCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    label: { fontSize: 11, fontWeight: "700", textTransform: 'uppercase' },
    value: { fontSize: 16, fontWeight: "600" },
    input: { padding: 12, borderRadius: 10, fontSize: 16, fontWeight: "600", borderWidth: 1 },
    actionContainer: { marginTop: 20 },
    row: { flexDirection: 'row', gap: 12 },
    btn: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
    },
    cancelBtn: { flex: 1, borderWidth: 1 },
    btnText: { color: "white", fontWeight: "700", fontSize: 16 },
});

export default UserProfileScreen;