// src/screens/AgreementScreen.js

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const AgreementScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close-outline" size={30} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.title}>Terms & Agreement</Text>
            </View>
            <ScrollView style={styles.container}>
                <Text style={styles.sectionTitle}>Rider Agreement</Text>
                <Text style={styles.paragraph}>
                    By using the RapidGo Rider app, you agree to be an independent contractor. You are responsible for delivering orders in a timely and safe manner.
                </Text>
                
                <Text style={styles.sectionTitle}>Payment Terms</Text>
                <Text style={styles.paragraph}>
                    RapidGo agrees to pay a commission of 70% of the total delivery fee for each completed order. Payments are processed weekly to your provided bank account.
                </Text>

                <Text style={styles.sectionTitle}>Code of Conduct</Text>
                <Text style={styles.paragraph}>
                    Riders must maintain professionalism with customers and restaurant partners. Any reports of misconduct may result in account suspension.
                </Text>
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
    paragraph: { fontSize: 16, color: COLORS.textNormal, marginBottom: 20, lineHeight: 22 },
});

export default AgreementScreen;