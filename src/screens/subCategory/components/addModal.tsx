import { View, Text, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react'
import { InputContainer, TextArea } from '../../../components/Input';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from '../../../context/themeContext';
import { StyleSheet } from 'react-native';

const AddSubCategory = ({
    modalVisible,
    onClose,
    msg,
    setMsg,
    setItem,
    PostLocally,
    item,
    setModalVisible
}: any) => {
    const { colors, isDarkMode } = useTheme();

    const handleChange = (key: string, value: string) => {
        if (msg.msg) setMsg({ msg: "", state: "" });
        setItem((prev: any) => ({
            ...prev,
            [key]: value
        }));
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.modalContainer, { backgroundColor: colors.background }]}
                >
                    {/* Header Handle */}
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        <View style={styles.headerRow}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="cube-outline" size={24} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.title, { color: colors.text }]}>
                                    {item?.sub_category_id ? "Edit Sub Category" : "New Sub Category"}
                                </Text>
                                <Text style={{ color: colors.subText, fontSize: 13 }}>
                                    Fill in the details below
                                </Text>
                            </View>
                        </View>

                        <View style={styles.form}>
                            <InputContainer
                                label="Category Name"
                                placeholder="e.g. Beverages"
                                value={item?.sub_category_name}
                                onChangeText={(text: string) => handleChange("sub_category_name", text)}
                            />

                            <View style={{ marginTop: 15 }}>
                                <Text style={[styles.label, { color: colors.primary }]}>Description</Text>
                                <TextArea
                                    placeholder="Brief description of this category..."
                                    value={item?.description}
                                    onChangeText={(text: string) => handleChange("description", text)}
                                />
                            </View>

                            {/* Info Box */}
                            <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                <Ionicons name="information-circle-outline" size={18} color={colors.subText} />
                                <Text style={[styles.infoText, { color: colors.subText }]}>
                                    Categories help you organize products for faster checkout.
                                </Text>
                            </View>
                        </View>

                        {msg.msg && <Toast setMsg={setMsg} msg={msg.msg} state={msg.state} />}

                        <View style={styles.buttonRow}>
                            <View style={{ flex: 1 }}>
                                <Button
                                    handleclick={onClose}
                                    outline
                                    title="Cancel"

                                />
                            </View>
                            <View style={{ flex: 2 }}>
                                <Button
                                    handleclick={PostLocally}
                                    title={item?.category_id ? "Update Category" : "Create Category"}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },
    modalContainer: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 12,
        maxHeight: '85%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 20
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 25
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4
    },
    form: {
        gap: 5
    },
    infoBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        marginTop: 20,
        alignItems: 'center'
    },
    infoText: {
        fontSize: 12,
        flex: 1,
        lineHeight: 18
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 30,
        alignItems: 'center'
    }
})

export default AddSubCategory;