// src/screens/HelpScreen.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const HelpScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close-outline" size={30} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.title}>Help & Support</Text>
            </View>
            <ScrollView style={styles.container}>
                <Text style={styles.sectionTitle}>Contact Us</Text>
                <Text style={styles.paragraph}>
                    If you have any issues with your orders or payments, please contact our support team.
                </Text>
                
                {/* --- FIXED SECTION: Icons and Text separate --- */}
                <View style={styles.contactBox}>
                    <View style={styles.contactRow}>
                        <Ionicons name="call" size={20} color={COLORS.primaryDark} style={styles.icon} />
                        <Text style={styles.contactText}>Hotline: 011-222-3333</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <Ionicons name="mail" size={20} color={COLORS.primaryDark} style={styles.icon} />
                        <Text style={styles.contactText}>Email: support@rapidgo.com</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <View style={styles.faqItem}>
                    <Text style={styles.qText}>Q: How do I get paid?</Text>
                    <Text style={styles.paragraph}>Your earnings are calculated weekly and transferred to your saved bank account.</Text>
                </View>
                
                <View style={styles.faqItem}>
                    <Text style={styles.qText}>Q: What if I need to cancel an order?</Text>
                    <Text style={styles.paragraph}>You can cancel an order using the "Cancel Order" button on the order details screen. Please select a valid reason.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    headerContainer: { 
        flexDirection: 'row', alignItems: 'center', padding: 15, 
        borderBottomWidth: 1, borderBottomColor: COLORS.border 
    },
    backButton: { padding: 5 },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginLeft: 15 },
    container: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10, marginTop: 10 },
    paragraph: { fontSize: 16, color: COLORS.textNormal, marginBottom: 10, lineHeight: 22 },
    
    contactBox: { 
        backgroundColor: COLORS.lightBackground, padding: 15, borderRadius: 10, marginBottom: 20 
    },
    contactRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 10
    },
    icon: { marginRight: 10 },
    contactText: { fontSize: 16, color: COLORS.textDark, fontWeight: '600' },
    
    faqItem: { marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    qText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryYellow, marginBottom: 5 },
});

export default HelpScreen;