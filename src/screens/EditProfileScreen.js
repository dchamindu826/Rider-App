// src/screens/EditProfileScreen.js
// --- (ALUTH FILE EKA) ---

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

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, login } = useAuth(); 
    
    // Form fields (danata thiyena data walin purawanawa)
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
    
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName || !phone || !vehicleNumber) {
            Toast.show({ type: 'error', text1: 'Missing Fields' });
            return;
        }
        setIsSaving(true);

        try {
            const updatedUser = await client
                .patch(user._id)
                .set({
                    fullName: fullName,
                    phone: phone,
                    vehicleNumber: vehicleNumber,
                })
                .commit({ returnDocuments: true });
            
            login(updatedUser[0]); 
            Toast.show({ type: 'success', text1: 'Profile Updated!' });
            navigation.goBack();

        } catch (err) {
            Toast.show({ type: 'error', text1: 'Update Failed' });
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
                        <Ionicons name="close-outline" size={30} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Profile</Text>
                </View>

                <ScrollView style={styles.container}>
                    <Text style={styles.label}>Full Name</Text>
                    <CustomTextInput 
                        iconName="person-outline" 
                        value={fullName} 
                        onChangeText={setFullName} 
                    />
                    
                    <Text style={styles.label}>Phone Number</Text>
                    <CustomTextInput 
                        iconName="call-outline" 
                        value={phone} 
                        onChangeText={setPhone} 
                        keyboardType="phone-pad"
                    />
                    
                    <Text style={styles.label}>Vehicle Number</Text>
                    <CustomTextInput 
                        iconName="car-sport-outline" 
                        value={vehicleNumber} 
                        onChangeText={setVehicleNumber} 
                    />

                    <Text style={styles.infoText}>
                        To change other details like ID, License, or Vehicle Type, please contact admin.
                    </Text>
                    
                    <CustomButton 
                        title={isSaving ? 'Saving...' : 'Save Changes'} 
                        onPress={handleSave} 
                        disabled={isSaving}
                        style={{marginTop: 20}}
                    />
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
    label: {
        fontSize: 16, 
        color: COLORS.textNormal, 
        marginBottom: 5,
        marginLeft: 5,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 15,
        paddingHorizontal: 10,
    }
});

export default EditProfileScreen;