// src/screens/WithdrawScreen.js
// --- FINAL FIX: (Bank Account Select Karana Logic Eka) ---

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { client } from '../sanity/sanityClient';
import CustomButton from '../components/CustomButton';
import CustomTextInput from '../components/CustomTextInput';
import CustomModalPicker from '../components/CustomModalPicker';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

// Comma danna function eka
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') { amount = parseFloat(amount) || 0; }
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const WithdrawScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const { balance } = route.params; 

    const [isSaving, setIsSaving] = useState(false);
    const [selectedAccountKey, setSelectedAccountKey] = useState(null); 
    const [amount, setAmount] = useState('');

    const bankAccountItems = user?.bankAccounts?.map(acc => ({
        label: `${acc.bankName} (...${acc.accountNumber.slice(-4)})`,
        value: acc._key, // Key eka value ekata gannawa
    })) || [];

    const handleWithdraw = async () => {
        const withdrawAmount = parseFloat(amount);
        if (!withdrawAmount || withdrawAmount <= 0) {
            Toast.show({ type: 'error', text1: 'Invalid Amount' }); return;
        }
        if (withdrawAmount > balance) {
            Toast.show({ type: 'error', text1: 'Insufficient Funds' }); return;
        }
        if (!selectedAccountKey) {
            Toast.show({ type: 'error', text1: 'No Bank Account' }); return;
        }

        // --- (!!!) ASLI FIX EKA MEKE (!!!) ---
        // Key eka use karala, hari account eke details gannawa
        const selectedAccount = user.bankAccounts.find(acc => acc._key === selectedAccountKey);

        if (!selectedAccount) {
            Toast.show({ type: 'error', text1: 'Could not find selected account' }); return;
        }

        setIsSaving(true);
        try {
            const doc = {
                _type: 'withdrawalRequest',
                rider: { _type: 'reference', _ref: user._id },
                amount: withdrawAmount,
                status: 'pending',
                // Dan hari details tika save wenawa
                bankName: selectedAccount.bankName,
                accountNumber: selectedAccount.accountNumber,
                accountName: selectedAccount.accountName,
            };
            await client.create(doc);
            
            setIsSaving(false);
            Alert.alert(
                'Request Sent!',
                `Your withdrawal request of LKR ${formatCurrency(withdrawAmount)} has been sent for admin approval.`
            );
            navigation.goBack();

        } catch (err) {
            setIsSaving(false);
            Toast.show({ type: 'error', text1: 'Request Failed' });
            console.error('Withdraw error:', err);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}>
                
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="close-outline" size={30} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Withdraw Funds</Text>
                </View>

                <ScrollView style={styles.container}>
                    <View style={styles.formSection}>
                        <Text style={styles.balanceText}>Available Balance: LKR {formatCurrency(balance)}</Text>
                        
                        <CustomTextInput 
                            iconName="cash-outline" 
                            placeholder="Amount to Withdraw" 
                            value={amount} 
                            onChangeText={setAmount} 
                            keyboardType="numeric"
                        />
                        
                        <Text style={styles.label}>Select Account:</Text>
                        <CustomModalPicker
                            placeholder="Select bank account..."
                            items={bankAccountItems}
                            selectedValue={selectedAccountKey}
                            onValueChange={(value) => setSelectedAccountKey(value)}
                        />
                        
                        <TouchableOpacity onPress={() => navigation.navigate('RiderPaymentSettings')}>
                            <Text style={styles.manageAccountText}>Manage Bank Accounts</Text>
                        </TouchableOpacity>

                        <CustomButton 
                            title={isSaving ? 'Submitting...' : 'Submit Withdrawal Request'} 
                            onPress={handleWithdraw} 
                            disabled={isSaving} 
                            style={{ marginTop: 20 }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 15, paddingTop: 15 },
    backButton: { padding: 5 },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginLeft: 15 },
    formSection: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    label: {
        fontSize: 16, 
        color: COLORS.textNormal, 
        marginBottom: 5,
        marginLeft: 5,
    },
    balanceText: { 
        fontSize: 20, 
        fontWeight: 'bold',
        color: COLORS.textDark, 
        marginBottom: 20, 
        textAlign: 'center' 
    },
    manageAccountText: {
        color: COLORS.primaryYellow,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
    }
});

export default WithdrawScreen;