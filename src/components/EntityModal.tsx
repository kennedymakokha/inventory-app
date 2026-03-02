// components/EntityModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface EntityModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
    fields: { key: string; label: string; placeholder: string; keyboardType?: 'default' | 'numeric' }[];
}

const EntityModal = ({ visible, onClose, onSave, initialData = {}, fields }: EntityModalProps) => {
    const [data, setData] = useState(initialData);

    useEffect(() => setData(initialData), [initialData]);

    const handleChange = (key: string, value: string) => setData((prev:any) => ({ ...prev, [key]: value }));

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.box}>
                    {fields.map(f => (
                        <TextInput
                            key={f.key}
                            placeholder={f.placeholder}
                            placeholderTextColor="#9ca3af"
                            keyboardType={f.keyboardType || 'default'}
                            value={data[f.key]?.toString() || ''}
                            onChangeText={v => handleChange(f.key, v)}
                            style={styles.input}
                        />
                    ))}

                    <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(data)}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={{ color: '#ef4444', fontWeight: '700' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    box: { width: '80%', padding: 20, borderRadius: 20, backgroundColor: '#1e293b' },
    input: { padding: 10, borderRadius: 10, marginBottom: 12, backgroundColor: '#0f172a', color: '#fff' },
    saveBtn: { backgroundColor: '#22c55e', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
    cancelBtn: { padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' }
});

export default EntityModal;