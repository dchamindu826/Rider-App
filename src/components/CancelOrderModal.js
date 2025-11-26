// src/components/CancelOrderModal.js
// --- ALUTH COMPONENT EKA ---

import React, { useState } from 'react';
import { 
    Modal, View, Text, StyleSheet, 
    TouchableOpacity, FlatList, KeyboardAvoidingView, Platform 
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import CustomTextInput from './CustomTextInput';

// Cancel karanna hethu
const REASONS = [
    'Customer requested to cancel',
    'I cannot find the location',
    'Order is too large for me',
    'Vehicle issue',
    'Other',
];

const CancelOrderModal = ({ isVisible, onClose, onSubmit }) => {
    const [selectedReason, setSelectedReason] = useState(null);
    const [otherReasonText, setOtherReasonText] = useState('');

    const handleSubmit = () => {
        if (!selectedReason) {
            return; // Reason ekak select karala nethnam submit karanna ba
        }
        const reason = selectedReason === 'Other' ? otherReasonText : selectedReason;
        if (!reason) {
            return; // 'Other' select karala type kare nethnam
        }
        onSubmit(reason);
        // Modal eka close unama states reset karanawa
        setTimeout(() => {
            setSelectedReason(null);
            setOtherReasonText('');
        }, 500);
    };

    const renderReason = ({ item }) => {
        const isSelected = selectedReason === item;
        return (
            <TouchableOpacity 
                style={[styles.reasonButton, isSelected && styles.reasonButtonSelected]}
                onPress={() => setSelectedReason(item)}
            >
                <Ionicons 
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24} 
                    color={isSelected ? COLORS.primaryYellow : COLORS.textLight} 
                />
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                    {item}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Reject Order</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={30} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.subtitle}>Please select a reason for rejection:</Text>
                    
                    <FlatList
                        data={REASONS}
                        renderItem={renderReason}
                        keyExtractor={(item) => item}
                        style={styles.list}
                    />

                    {selectedReason === 'Other' && (
                        <CustomTextInput
                            placeholder="Please specify your reason"
                            value={otherReasonText}
                            onChangeText={setOtherReasonText}
                            style={{ marginTop: 10 }}
                        />
                    )}

                    <CustomButton
                        title="Submit Reason"
                        onPress={handleSubmit}
                        disabled={!selectedReason || (selectedReason === 'Other' && !otherReasonText)}
                        style={{ marginTop: 20 }}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textNormal,
        marginBottom: 15,
    },
    list: {
        maxHeight: 250, // List eka loku wadi unoth scroll wenna
    },
    reasonButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        marginBottom: 10,
    },
    reasonButtonSelected: {
        borderColor: COLORS.primaryYellow,
        backgroundColor: '#FFFBEB',
    },
    reasonText: {
        fontSize: 16,
        color: COLORS.textNormal,
        marginLeft: 10,
    },
    reasonTextSelected: {
        color: COLORS.textDark,
        fontWeight: 'bold',
    },
});

export default CancelOrderModal;