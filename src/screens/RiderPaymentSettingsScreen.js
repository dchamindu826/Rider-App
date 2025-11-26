// src/screens/RiderPaymentSettingsScreen.js
// --- FINAL FIX: (Keyboard Bug eka Fix Kala) ---

import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Platform, 
    StatusBar, TouchableOpacity, ActivityIndicator, 
    KeyboardAvoidingView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { client } from '../sanity/sanityClient';
import CustomButton from '../components/CustomButton';
import CustomTextInput from '../components/CustomTextInput';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

const RiderPaymentSettingsScreen = () => {
    const navigation = useNavigation();
    const { user, login } = useAuth(); // login function eka gannawa user update karanna
    
    // Aluth account ekak hadana form eka
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleAddNewAccount = async () => {
        if (!bankName || !accountNumber || !accountName) {
            Toast.show({ type: 'error', text1: 'Missing Fields' });
            return;
        }
        setIsSaving(true);

        const newAccount = {
            _type: 'object',
            _key: Math.random().toString(36).substring(7), // Unique key
            bankName: bankName,
            accountNumber: accountNumber,
            accountName: accountName,
        };

        try {
            // Rider document ekata aluth bank account eka 'bankAccounts' array ekata append karanawa
            const updatedUser = await client
                .patch(user._id)
                .setIfMissing({ bankAccounts: [] }) // bankAccounts array eka nethnam hadanawa
                .append('bankAccounts', [newAccount]) // Aluth eka add karanawa
                .commit({ returnDocuments: true }); // Update karapu userwa ayeth gannawa
            
            login(updatedUser[0]); // AuthContext eka update karanawa (commit eken array ekak enne)
            Toast.show({ type: 'success', text1: 'Account Added!' });
            // Form eka clear karanawa
            setBankName('');
            setAccountNumber('');
            setAccountName('');
        } catch (err) {
            console.error("Add bank account error:", err);
            Toast.show({ type: 'error', text1: 'Failed to add account' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveAccount = async (accountKey) => {
        setIsSaving(true);
        try {
            // Array eken dapu key ekata adala item eka unset (remove) karanawa
            const updatedUser = await client
                .patch(user._id)
                .unset([`bankAccounts[_key=="${accountKey}"]`])
                .commit({ returnDocuments: true });

            login(updatedUser[0]); // AuthContext eka update karanawa
            Toast.show({ type: 'success', text1: 'Account Removed!' });
        } catch (err) {
            console.error("Remove bank account error:", err);
            Toast.show({ type: 'error', text1: 'Failed to remove account' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back-outline" size={30} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Bank Accounts</Text>
                </View>

                <ScrollView style={styles.container}>
                    {/* --- Danata Save Karapu Accounts Pennanawa --- */}
                    <Text style={styles.sectionTitle}>Saved Accounts</Text>
                    {user?.bankAccounts && user.bankAccounts.length > 0 ? (
                        user.bankAccounts.map((acc) => (
                            <View key={acc._key} style={styles.accountCard}>
                                <View style={styles.accountDetails}>
                                    <Text style={styles.bankName}>{acc.bankName}</Text>
                                    <Text style={styles.accountNum}>{acc.accountNumber}</Text>
                                    <Text style={styles.accountName}>{acc.accountName}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveAccount(acc._key)} disabled={isSaving}>
                                    <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No bank accounts added yet.</Text>
                    )}

                    {/* --- Aluth Account Ekak Add Karana Form Eka --- */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Add New Account</Text>
                        <CustomTextInput 
                            iconName="business-outline" 
                            placeholder="Bank Name" 
                            value={bankName} 
                            onChangeText={setBankName} 
                        />
                        <CustomTextInput 
                            iconName="keypad-outline" 
                            placeholder="Account Number" 
                            value={accountNumber} 
                            onChangeText={setAccountNumber} 
                            keyboardType="numeric"
                        />
                        <CustomTextInput 
                            iconName="person-outline" 
                            placeholder="Account Holder Name" 
                            value={accountName} 
                            onChangeText={setAccountName} 
                        />
                        <CustomButton 
                            title={isSaving ? 'Saving...' : 'Save Account'} 
                            onPress={handleAddNewAccount} 
                            disabled={isSaving} 
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    headerContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backButton: { padding: 5 },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginLeft: 15 },
    container: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
    accountCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    accountDetails: {
        flex: 1,
        marginRight: 10,
    },
    bankName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
    accountNum: { fontSize: 14, color: COLORS.textNormal, marginVertical: 2 },
    accountName: { fontSize: 14, color: COLORS.textLight },
    emptyText: { color: COLORS.textLight, textAlign: 'center', marginVertical: 10 },
    formSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    }
});

export default RiderPaymentSettingsScreen;