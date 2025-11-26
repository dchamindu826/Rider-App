// src/screens/ProfileScreen.js
// --- FINAL FIX: (Aluth Screens 3kata Link Kala) ---

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { urlFor } from '../sanity/sanityClient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 

const placeholderImage = 'https://placehold.co/100x100/e0e0e0/b0b0b0?text=Rider';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const navigation = useNavigation(); 
    
    const handleLogout = () => {
        Alert.alert(
            "Logout", "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: () => logout() }
            ]
        );
    };

    const logoUrl = user?.faceImage 
        ? urlFor(user.faceImage).width(200).url() 
        : placeholderImage;

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <ScrollView style={styles.container}>
                
                <View style={styles.profileHeader}>
                    <Image source={{ uri: logoUrl }} style={styles.profileImage} />
                    <Text style={styles.riderName}>{user?.fullName || 'Rider'}</Text>
                    {/* --- Schema ekata galapenna vehicleNumber damma --- */}
                    <Text style={styles.riderEmail}>{user?.phone}</Text>
                    <Text style={styles.riderPhone}>{user?.vehicleNumber} ({user?.vehicleType})</Text>
                </View>

                <View style={styles.menuContainer}>
                    {/* --- Aluth Link Add Kala --- */}
                    <ProfileMenuItem 
                        icon="person-circle-outline"
                        title="Edit My Profile"
                        onPress={() => navigation.navigate('EditProfileScreen')}
                    />
                    <ProfileMenuItem 
                        icon="wallet-outline"
                        title="My Earnings"
                        onPress={() => navigation.navigate('Earnings')}
                    />
                    <ProfileMenuItem 
                        icon="card-outline"
                        title="Bank Accounts"
                        onPress={() => navigation.navigate('RiderPaymentSettings')}
                    />
                    <ProfileMenuItem 
                        icon="help-buoy-outline"
                        title="Help & Support"
                        onPress={() => navigation.navigate('HelpScreen')}
                    />
                    <ProfileMenuItem 
                        icon="document-text-outline"
                        title="Terms & Agreement"
                        onPress={() => navigation.navigate('AgreementScreen')}
                    />
                    <ProfileMenuItem 
                        icon="log-out-outline"
                        title="Logout"
                        onPress={handleLogout}
                        isDestructive={true}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const ProfileMenuItem = ({ icon, title, onPress, isDestructive = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Ionicons 
            name={icon} 
            size={24} 
            color={isDestructive ? COLORS.danger : COLORS.primaryYellow} 
            style={styles.menuIcon} 
        />
        <Text style={[styles.menuTitle, isDestructive && { color: COLORS.danger }]}>
            {title}
        </Text>
        <Ionicons name="chevron-forward-outline" size={22} color={COLORS.textLight} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.lightBackground },
    container: { flex: 1 },
    profileHeader: {
        backgroundColor: COLORS.white,
        paddingVertical: 30,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.border,
        marginBottom: 15,
    },
    riderName: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark },
    riderEmail: { fontSize: 16, color: COLORS.textLight, marginTop: 4 }, 
    riderPhone: { fontSize: 16, color: COLORS.textLight, marginTop: 4 }, 
    menuContainer: {
        marginTop: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuIcon: { width: 30 },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textNormal,
        marginLeft: 10,
    },
});

export default ProfileScreen;