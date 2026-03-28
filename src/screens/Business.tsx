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
    SafeAreaView
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useBusiness, Business } from "../context/BusinessContext";
import { useUpdatebusinessMutation } from "../services/businessApi";
import { useTheme } from "../context/themeContext";

const BusinessProfileScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const { business, updateBusiness, isLoading } = useBusiness();
    const [updateBusinessRemotely, { isLoading: isUpdating }] = useUpdatebusinessMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const [data, setData] = useState<Business>({
        _id: "", business_name: "", postal_address: "", phone_number: "",
        contact_number: "", kra_pin: "", printQr: false, working_hrs: "8-17",
        api_key: "", latitude: 0, longitude: 0, primary_color: "",
        secondary_color: "", logo: "", state: "inactive", strictMpesa: false,
    });

    useEffect(() => {
        if (business && !isEditing) {
            setData({ ...business, printQr: business.printQr ?? false, strictMpesa: business.strictMpesa ?? false });
        }
    }, [business]);

    const handleChange = (key: keyof Business, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            const updated = await updateBusinessRemotely(data).unwrap();
            updateBusiness(updated);
            setIsEditing(false);
        } catch (err) { console.error(err); }
    };

    const renderField = (label: string, key: keyof Business, icon: string, secure: boolean = false) => (
        <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.fieldHeader}>
                <Ionicons name={icon} size={14} color={colors.primary} />
                <Text style={[styles.fieldLabel, { color: colors.subText }]}>{label}</Text>
            </View>
            {isEditing ? (
                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}
                    value={String(data[key])}
                    onChangeText={(t) => handleChange(key, t)}
                    secureTextEntry={secure && !showKey}
                    placeholder={`Enter ${label}`}
                    placeholderTextColor={colors.subText}
                />
            ) : (
                <Text style={[styles.valueText, { color: colors.text }]} numberOfLines={1}>
                    {secure && !showKey ? "••••••••••••" : data[key] || "---"}
                </Text>
            )}
        </View>
    );

    if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* SECTION 1: IDENTITY */}
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Business Identity</Text>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>{renderField("Business Name", "business_name", "business")}</View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>{renderField("Phone", "phone_number", "call")}</View>
                        <View style={{ flex: 1 }}>{renderField("Contact Person", "contact_number", "person")}</View>
                    </View>

                    {/* SECTION 2: LOGISTICS & TAX */}
                    <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>Location & Tax</Text>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>{renderField("Latitude", "latitude", "location")}</View>
                        <View style={{ flex: 1 }}>{renderField("Longitude", "longitude", "compass")}</View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>{renderField("KRA PIN", "kra_pin", "document-text")}</View>
                        <View style={{ flex: 1 }}>{renderField("Postal Address", "postal_address", "mail")}</View>
                    </View>

                    {/* SECTION 3: SYSTEM CONFIG */}
                    <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>System Configuration</Text>
                    {renderField("API Access Key", "api_key", "key", true)}
                    <View style={[styles.row, { marginTop: 12 }]}>
                        <View style={{ flex: 1 }}>{renderField("Primary Color", "primary_color", "color-palette")}</View>
                        <View style={{ flex: 1 }}>{renderField("Secondary Color", "secondary_color", "color-fill")}</View>
                    </View>
                    <View style={[styles.row, { marginTop: 12 }]}>
                        <View style={{ flex: 1 }}>{renderField("Logo URL", "logo", "image")}</View>
                        <View style={{ flex: 1 }}>{renderField("Terminal State", "state", "shield-checkmark")}</View>
                    </View>

                    {/* SECTION 4: WORKING HOURS (RADIO SELECTION) */}
                    <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>Operational Hours</Text>
                    <View style={[styles.hoursContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {[
                            { label: "8 AM - 5 PM", value: "8-17" },
                            { label: "9 AM - 6 PM", value: "9-18" },
                            { label: "24 Hours", value: "00-24" },
                        ].map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={styles.hourOption}
                                onPress={() => isEditing && handleChange("working_hrs", opt.value)}
                            >
                                <Ionicons 
                                    name={data.working_hrs === opt.value ? "radio-button-on" : "radio-button-off"} 
                                    size={20} 
                                    color={data.working_hrs === opt.value ? colors.primary : colors.subText} 
                                />
                                <Text style={[styles.hourLabel, { color: colors.text }]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* SECTION 5: TOGGLES */}
                    <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>Feature Access</Text>
                    <View style={styles.row}>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, { backgroundColor: colors.card, borderColor: data.printQr ? colors.primary : colors.border }]}
                            onPress={() => isEditing && handleChange("printQr", !data.printQr)}
                        >
                            <Ionicons name="qr-code" size={18} color={data.printQr ? colors.primary : colors.subText} />
                            <Text style={[styles.toggleText, { color: colors.text }]}>Receipt QR</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.toggleBtn, { backgroundColor: colors.card, borderColor: data.strictMpesa ? colors.primary : colors.border }]}
                            onPress={() => isEditing && handleChange("strictMpesa", !data.strictMpesa)}
                        >
                            <Ionicons name="card" size={18} color={data.strictMpesa ? colors.primary : colors.subText} />
                            <Text style={[styles.toggleText, { color: colors.text }]}>Strict Mpesa</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* STICKY ACTION BAR */}
                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => {/* Location Logic */}}>
                        <Ionicons name="navigate-outline" size={20} color={colors.primary} />
                        <Text style={[styles.btnText, { color: colors.primary }]}>Locate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]} 
                        onPress={isEditing ? handleSave : () => setIsEditing(true)}
                    >
                        {isUpdating ? <ActivityIndicator color="#fff" /> : (
                            <Text style={[styles.btnText, { color: '#fff' }]}>{isEditing ? "Save Configuration" : "Edit Details"}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { padding: 16, paddingBottom: 150 },
    sectionTitle: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 },
    row: { flexDirection: "row", gap: 12, marginBottom: 12 },
    fieldCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, minHeight: 65, justifyContent: 'center' },
    fieldHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    fieldLabel: { fontSize: 10, fontWeight: "700", textTransform: 'uppercase' },
    valueText: { fontSize: 14, fontWeight: "600" },
    input: { padding: 4, fontSize: 14, fontWeight: "600", borderRadius: 4 },
    hoursContainer: { padding: 8, borderRadius: 12, borderWidth: 1, gap: 4 },
    hourOption: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    hourLabel: { fontWeight: '600', fontSize: 14 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, gap: 10 },
    toggleText: { fontWeight: '700', fontSize: 13 },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 16, flexDirection: 'row', gap: 12, borderTopWidth: 1 },
    actionBtn: { flex: 1, height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
    secondaryBtn: { borderWidth: 1, borderColor: '#CBD5E1' },
    btnText: { fontWeight: '700', fontSize: 15 }
});

export default BusinessProfileScreen;