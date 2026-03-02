import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from '../../../components/Toast';
import Button from '../../../components/Button';

const CSVUploadModal = ({
    modalVisible,
    setModalVisible,
    onUpload, // Function to handle the actual file processing
    isDarkMode,
    msg,
    setMsg
}: any) => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ name: string; size?: number } | null>(null);

    const theme = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        card: isDarkMode ? '#1e293b' : '#ffffff',
        text: isDarkMode ? '#f8fafc' : '#1e293b',
        subtext: isDarkMode ? '#94a3b8' : '#64748b',
        border: isDarkMode ? '#334155' : '#e2e8f0',
        dropzone: isDarkMode ? '#1e293b' : '#f1f5f9',
    };

    const handleFilePick = async () => {
        setIsSelecting(true);
        // Logic for DocumentPicker would go here
        // For now, simulating a selection:
        setTimeout(() => {
            setSelectedFile({ name: 'products_inventory_2024.csv', size: 1240 });
            setIsSelecting(false);
        }, 800);
    };

    const resetAndClose = () => {
        setSelectedFile(null);
        setMsg({ msg: "", state: "" });
        setModalVisible(false);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={resetAndClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    
                    <Text style={[styles.title, { color: theme.text }]}>Import Products</Text>
                    
                    <Text style={[styles.description, { color: theme.subtext }]}>
                        Upload a CSV file to add multiple products at once. Ensure your headers match the template.
                    </Text>

                    {/* Upload Dropzone / Trigger */}
                    <TouchableOpacity 
                        onPress={handleFilePick}
                        style={[
                            styles.dropzone, 
                            { 
                                backgroundColor: theme.dropzone, 
                                borderColor: selectedFile ? '#22c55e' : theme.border,
                                borderStyle: selectedFile ? 'solid' : 'dashed'
                            }
                        ]}
                    >
                        {isSelecting ? (
                            <ActivityIndicator color="#3b82f6" />
                        ) : selectedFile ? (
                            <View style={styles.fileInfo}>
                                <Icon name="file-check" size={40} color="#22c55e" />
                                <Text style={[styles.fileName, { color: theme.text }]}>{selectedFile.name}</Text>
                                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                    <Text style={{ color: '#ef4444', marginTop: 4, fontWeight: '600' }}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.fileInfo}>
                                <Icon name="cloud-upload-outline" size={40} color={theme.subtext} />
                                <Text style={[styles.uploadText, { color: theme.text }]}>Tap to select CSV</Text>
                                <Text style={{ color: theme.subtext, fontSize: 12 }}>Max size: 5MB</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {msg.msg && (
                        <View style={{ marginBottom: 15 }}>
                            <Toast msg={msg.msg} state={msg.state} />
                        </View>
                    )}

                    <View style={styles.buttonRow}>
                        <View style={{ flex: 1 }}>
                            <Button 
                                handleclick={resetAndClose} 
                                loading={false}
                                outline 
                                title="Cancel" 
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Button 
                                handleclick={() => onUpload(selectedFile)} 
                                disabled={!selectedFile}
                                loading={false} 
                                title="Upload" 
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        elevation: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    dropzone: {
        height: 160,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    fileInfo: {
        alignItems: 'center',
    },
    fileName: {
        marginTop: 10,
        fontWeight: '700',
        fontSize: 15,
    },
    uploadText: {
        marginTop: 8,
        fontWeight: '600',
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    }
});

export default CSVUploadModal;