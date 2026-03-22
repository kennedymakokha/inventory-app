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
    Platform
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useBusiness, Business } from "../context/BusinessContext";
import { useUpdatebusinessMutation } from "../services/businessApi";
import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid } from "react-native";
import { useTheme } from "../context/themeContext";

const BusinessProfileScreen = () => {
    const { colors } = useTheme();
    const { business, updateBusiness, isLoading } = useBusiness();
    const [updateBusinessRemotely, { isLoading: isUpdating }] = useUpdatebusinessMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const [data, setData] = useState<Business>({
        _id: "",
        business_name: "",
        postal_address: "",
        phone_number: "",
        contact_number: "",
        kra_pin: "",
        printQr: false,
        working_hrs: "8-17",
        api_key: "",
        latitude: 0,
        longitude: 0,
        primary_color: "",
        secondary_color: "",
        logo: "",
        state: "inactive",
        strictMpesa: false,
    });

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
        if (!hasPermission) return;

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setData(prev => ({ ...prev, latitude, longitude }));
            },
            () => { },
            { enableHighAccuracy: true }
        );
    };

    useEffect(() => {
        if (business && !isEditing) {
            setData({
                ...business,
                printQr: business.printQr ?? false,
                strictMpesa: business.strictMpesa ?? false,
            });
        }
    }, [business]);

    const handleChange = (key: keyof Business, value: any) => {
        setData(prev => ({
            ...prev,
            [key]: key === "latitude" || key === "longitude" ? Number(value) : value
        }));
    };

    const handleSave = async () => {
        try {
            const updated = await updateBusinessRemotely(data).unwrap();
            updateBusiness(updated);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        }
    };

    const renderRow = (fields: any[]) => (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            {fields.map(field => (
                <View key={field.key} style={{ flex: 1 }}>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.header}>
                            <Ionicons name={field.icon} size={16} color={colors.primary} />
                            <Text style={[styles.label, { color: colors.primary }]}>{field.label}</Text>
                        </View>

                        {isEditing ? (
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={String(data[field.key])}
                                onChangeText={(t) => handleChange(field.key, t)}
                                secureTextEntry={field.secure && !showKey}
                            />
                        ) : (
                            <Text style={{ color: colors.text }}>
                                {field.secure && !showKey ? "••••••••" : data[field.key]}
                            </Text>
                        )}
                    </View>
                </View>
            ))}
        </View>
    );

    const renderRadio = (label: string, key: keyof Business) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
            <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
            <View style={styles.radioRow}>
                {["Yes", "No"].map(val => {
                    const boolVal = val === "Yes";
                    return (
                        <TouchableOpacity
                            key={val}
                            style={styles.radioItem}
                            onPress={() => setData(prev => ({ ...prev, [key]: boolVal }))}
                        >
                            <View style={[styles.radioOuter, data[key] === boolVal && styles.radioActive]}>
                                {data[key] === boolVal && <View style={styles.radioInner} />}
                            </View>
                            <Text style={{ color: colors.text }}>{val}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={80}
            >  <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 200, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >

                    {renderRow([{ label: "Business Name", key: "business_name", icon: "business-outline" }])}

                    {renderRow([
                        { label: "Phone", key: "phone_number", icon: "call-outline" },
                        { label: "Contact", key: "contact_number", icon: "person-outline" }
                    ])}

                    {renderRow([
                        { label: "Latitude", key: "latitude", icon: "navigate-outline" },
                        { label: "Longitude", key: "longitude", icon: "compass-outline" }
                    ])}

                    {renderRow([
                        { label: "KRA PIN", key: "kra_pin", icon: "document-text-outline" },
                        { label: "Postal", key: "postal_address", icon: "location-outline" }
                    ])}

                    {renderRow([
                        { label: "API Key", key: "api_key", icon: "key-outline", secure: true },
                        { label: "State", key: "state", icon: "toggle-outline" }
                    ])}

                    {renderRow([
                        { label: "Primary Color", key: "primary_color", icon: "color-palette-outline" },
                        { label: "Secondary Color", key: "secondary_color", icon: "color-fill-outline" }
                    ])}

                    {renderRow([
                        { label: "Logo URL", key: "logo", icon: "image-outline" }
                    ])}

                    {renderRadio("Print QR", "printQr")}

                    {data.api_key && data.api_key.trim() !== "" && (
                        <View style={{ marginBottom: 16 }}>
                            {renderRadio("Strict Mpesa", "strictMpesa")}
                        </View>
                    )}
                    {/* Working Hours Radio Group */}
                    {/* Working Hours */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={[styles.label, { color: colors.primary }]}>Working Hours</Text>
                        <View style={{ flexDirection: "row", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                            {[
                                { label: "8 AM - 5 PM", value: "8-17" },
                                { label: "9 AM - 6 PM", value: "9-18" },
                                { label: "24 Hours", value: "00-24" },
                            ].map(opt => (
                                <TouchableOpacity
                                className="gap-x-3"
                                    key={opt.value}
                                    style={styles.radioItem}
                                    onPress={() => isEditing && handleChange("working_hrs", opt.value)} // only change in edit mode
                                >
                                    <View
                                        style={[
                                            styles.radioOuter,
                                            data.working_hrs === opt.value && styles.radioActive,
                                        ]}
                                    >
                                        {data.working_hrs === opt.value && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={{ color: colors.text }}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.bottomBar}>
                        <TouchableOpacity style={styles.btn} onPress={getCurrentLocation}>
                            <Text style={styles.btnText}>Use Location</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: colors.primary }]}
                            onPress={isEditing ? handleSave : () => setIsEditing(true)}
                        >
                            <Text style={styles.btnText}>
                                {isEditing ? "Save" : "Edit"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default BusinessProfileScreen;

const styles = StyleSheet.create({
    card: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: "#111", // or colors.card
        borderTopWidth: 1,
        borderColor: "#333",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 5,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderRadius: 6,
        padding: 8,
    },
    btn: {
        marginTop: 15,
        padding: 14,
        backgroundColor: "#4CAF50",
        borderRadius: 8,
        alignItems: "center",
    },
    btnText: {
        color: "#fff",
        fontWeight: "bold",
    },
    radioRow: {
        flexDirection: "row",
        justifyContent: "flex-start", // or "space-between" if you want them spread
        marginTop: 10,
    },

    radioItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 20, // <-- Add spacing between each radio button
    },

    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#999",
        justifyContent: "center",
        alignItems: "center",
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#4CAF50",
    },
    radioActive: {
        borderColor: "#4CAF50",
    },
});