import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSettings } from "../context/SettingsContext";
import { Theme } from "../utils/theme";
import { useUser } from "../context/UserContext";

const fields = [
    { label: "Name", key: "name", icon: "person-outline" },
    { label: "Email", key: "email", icon: "mail-outline", locked: true },
    { label: "Phone Number", key: "phone_number", icon: "call-outline" },
];

const UserProfileScreen = () => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;

    const { user, updateUser, isLoading, isUpdating } = useUser();

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

    const handleChange = (key: keyof typeof data, value: string) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (user) {
            await updateUser(data);
            setIsEditing(false);
        }
    };

    const startEditing = () => {
        if (user) setData(user);
        setIsEditing(true);
    };

    const renderField = (
        label: string,
        key: keyof typeof data,
        icon: any,
        locked?: boolean
    ) => (
        <View
            style={[styles.fieldCard, { borderColor: theme.border, backgroundColor: theme.card }]}
            key={key}
        >
            <View style={styles.fieldHeader}>
                <Ionicons name={icon} size={18} color={Theme.primary} />
                <Text style={[styles.label, { color: Theme.primary }]}>{label}</Text>
            </View>

            {isEditing && !locked ? (
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                    value={data[key]}
                    onChangeText={(text) => handleChange(key, text)}
                />
            ) : (
                <View style={styles.valueRow}>
                    <Text style={[styles.value, { color: theme.text }]}>{data[key]}</Text>
                </View>
            )}
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={Theme.primary} />
                <Text style={{ marginTop: 10, color: theme.text }}>Loading User Profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            {fields.map(field =>
                renderField(field.label, field.key as keyof typeof data, field.icon, field.locked)
            )}

            {isUpdating && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.overlayText}>Saving changes...</Text>
                </View>
            )}

            <TouchableOpacity
                disabled={isUpdating}
                style={[styles.button, { backgroundColor: Theme.primary, borderColor: theme.border, opacity: isUpdating ? 0.7 : 1 }]}
                onPress={isEditing ? handleSave : startEditing}
            >
                <Ionicons name={isEditing ? "save-outline" : "create-outline"} size={18} color="#fff" />
                <Text style={styles.buttonText}>{isEditing ? "Save Changes" : "Edit Profile"}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    fieldCard: { borderWidth: 1, borderRadius: 5, padding: 14, marginBottom: 16 },
    fieldHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 },
    label: { fontSize: 13 },
    valueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    value: { fontSize: 16, fontWeight: "500" },
    input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 15 },
    button: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20, padding: 14, borderRadius: 5, gap: 8 },
    buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
    overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    overlayText: { color: "#fff", marginTop: 10, fontSize: 16, fontWeight: "500" },
});