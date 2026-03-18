import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Switch
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Theme } from "../utils/theme";
import { useSettings } from "../context/SettingsContext";
import { useBusiness, Business } from "../context/BusinessContext";
import { useUpdatebusinessMutation } from "../services/businessApi";
import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid } from "react-native";
import { Picker } from "@react-native-picker/picker";

const fields = [
    { label: "Business Name", key: "business_name", icon: "business-outline" },
    { label: "Postal Address", key: "postal_address", icon: "location-outline" },
    { label: "Phone Number", key: "phone_number", icon: "call-outline" },
    { label: "Contact Number", key: "contact_number", icon: "person-outline" },
    { label: "KRA PIN", key: "kra_pin", icon: "document-text-outline" },
    { label: "Latitude", key: "latitude", icon: "navigate-outline" },
    { label: "Longitude", key: "longitude", icon: "compass-outline" },
    { label: "API Key", key: "api_key", icon: "key-outline", secure: true, locked: true },
];

const BusinessProfileScreen = () => {
    const { isDarkMode } = useSettings();
    const theme = isDarkMode ? Theme.dark : Theme.light;
    const { business, updateBusiness, isLoading } = useBusiness();
    const [updateBusinessRemotely, { isLoading: isUpdating }] = useUpdatebusinessMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [printQr, setPrintQr] = useState(false); //  toggle state
    const [data, setData] = useState<Business>({
        _id: "",
        business_name: "",
        postal_address: "",
        phone_number: "",
        contact_number: "",
        kra_pin: "",
        printQr: true,
        working_hrs: "",
        api_key: "",
        latitude: 0,
        longitude: 0
    });
    const [locationEnabled, setLocationEnabled] = useState(true);

    const requestLocationPermission = async () => {
        if (Platform.OS === "ios") return true;
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch {
            return false;
        }
    };

    const getCurrentLocation = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            setLocationEnabled(false);
            return;
        }
        setLocationEnabled(true);
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setData(prev => ({ ...prev, latitude, longitude }));
            },
            () => { },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    useEffect(() => {
        if (business && !isEditing && JSON.stringify(data) !== JSON.stringify(business)) {
            setData(business);
        }
    }, [business]);

    const handleChange = (key: keyof Business, value: string) => {
        setData(prev => ({
            ...prev,
            [key]: key === "latitude" || key === "longitude" ? Number(value) : value
        }));
    };

    const startEditing = () => {
        if (business) setData(business);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const updatedBusiness = await updateBusinessRemotely({
                ...data,
                headers: { "x-source": "socket" }
            }).unwrap();
            updateBusiness(updatedBusiness);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update business:", err);
        }
    };

    const renderField = (label: string, key: keyof Business, icon: string, secure?: boolean, locked?: boolean) => (
        <View key={key} style={[styles.fieldCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <View style={styles.fieldHeader}>
                <Ionicons name={icon} size={18} color={Theme.primary} />
                <Text style={[styles.label, { color: Theme.primary }]}>{label}</Text>
            </View>
            {isEditing && !locked ? (
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                    value={String(data[key])}
                    onChangeText={text => handleChange(key, text)}
                    secureTextEntry={secure && !showKey}
                />
            ) : (
                <View style={styles.valueRow}>
                    <Text style={[styles.value, { color: theme.text }]}>
                        {secure && !showKey ? "••••••••••••••" : data[key]}
                    </Text>
                    {secure && (
                        <TouchableOpacity onPress={() => setShowKey(!showKey)}>
                            <Ionicons name={showKey ? "eye-off-outline" : "eye-outline"} size={18} color={Theme.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={Theme.primary} />
                <Text style={{ marginTop: 10, color: theme.text }}>Loading Business Profile...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} style={[styles.container, { backgroundColor: theme.background }]}>
                {fields.map(field =>
                    renderField(field.label, field.key as keyof Business, field.icon, field.secure, field.locked)
                )}

                {/*  Working Hours Picker */}
                <View style={[styles.fieldCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <View style={styles.fieldHeader}>
                        <Ionicons name="time-outline" size={18} color={Theme.primary} />
                        {data.working_hrs === "8-17"
                            ? "8 AM - 5 PM"
                            : data.working_hrs === "9-18"
                                ? "9 AM - 6 PM"
                                : data.working_hrs === "00-24"
                                    ? "24 Hours"
                                    : "Not set"}
                    </View>
                    {isEditing ? (
                        <Picker
                            selectedValue={data.working_hrs}
                            onValueChange={(value) => handleChange("working_hrs", value)}
                            style={{ color: theme.text }}
                        >
                            <Picker.Item label="8 AM - 5 PM" value="8-17" />
                            <Picker.Item label="9 AM - 6 PM" value="9-18" />
                            <Picker.Item label="24 Hours" value="00-24" />
                        </Picker>
                    ) : (
                        <Text style={[styles.value, { color: theme.text }]}>{data.working_hrs || "Not set"}</Text>
                    )}
                </View>

                {/*  Toggle for Print QR Code */}
                <View style={[styles.fieldCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <View style={styles.fieldHeader}>
                        <Ionicons name="qr-code-outline" size={18} color={Theme.primary} />
                        <Text style={[styles.label, { color: Theme.primary }]}>Print QR Code</Text>
                    </View>
                    <Switch value={data.printQr} onValueChange={(value) =>
                        setData(prev => ({ ...prev, printQr: value }))
                    } />
                </View>

                {isEditing && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: locationEnabled ? "#4CAF50" : "#888" }]}
                        disabled={!locationEnabled}
                        onPress={getCurrentLocation}
                    >
                        <Ionicons name="locate-outline" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Use Current Location</Text>
                    </TouchableOpacity>
                )}

                {isUpdating && (
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.overlayText}>Saving changes...</Text>
                    </View>
                )}

                <TouchableOpacity
                    disabled={isUpdating}
                    style={[styles.button, { backgroundColor: Theme.primary, opacity: isUpdating ? 0.7 : 1 }]}
                    onPress={isEditing ? handleSave : startEditing}
                >
                    <Ionicons name={isEditing ? "save-outline" : "create-outline"} size={18} color="#fff" />
                    <Text style={styles.buttonText}>{isEditing ? "Save Changes" : "Edit Profile"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default BusinessProfileScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    fieldCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    fieldHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
    },
    valueRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    value: {
        fontSize: 16,
        fontWeight: "500",
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        fontSize: 15,
    },
    button: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    overlayText: {
        color: "#fff",
        marginTop: 10,
        fontSize: 16,
        fontWeight: "500",
    },
});
