// src/screens/NotificationScreen.js
// --- FINAL FIX: (Aluth Sanity Schema + Mark as Read) ---

import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, 
    TouchableOpacity, ActivityIndicator, SafeAreaView,
    Platform, StatusBar
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { client } from '../sanity/sanityClient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_READ_ANNOUNCEMENT_KEY = 'lastReadAnnouncementId';

// Date eka format karana function eka
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
};

const NotificationScreen = () => {
    const navigation = useNavigation();
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const markAsRead = async (newestId) => {
        try {
            await AsyncStorage.setItem(LAST_READ_ANNOUNCEMENT_KEY, newestId);
        } catch (e) {
            console.error("Failed to save read status", e);
        }
    };

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            // "riders" walata hari "all" walata hari target karapu ewa gannawa
            const query = `
                *[_type == "announcement" && (target == 'all' || target == 'riders')] 
                | order(createdAt desc) 
            `;
            const data = await client.fetch(query);
            setAnnouncements(data);

            if (data.length > 0) {
                const newestId = data[0]._id;
                markAsRead(newestId);
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to load notifications' });
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAnnouncements();
        }, [])
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardIcon}>
                <Ionicons name="megaphone-outline" size={24} color={COLORS.primaryYellow} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.cardDescription}>{item.message}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close-outline" size={30} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primaryYellow} style={styles.loader} />
            ) : (
                <FlatList
                    data={announcements}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>No new announcements.</Text>}
                    onRefresh={fetchAnnouncements}
                    refreshing={isLoading}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.border 
    },
    backButton: { padding: 5 },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginLeft: 15 },
    listContainer: { padding: 15, backgroundColor: COLORS.lightBackground, flex: 1 },
    emptyText: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', marginTop: 50 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardIcon: {
        marginRight: 15,
        paddingTop: 2,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    cardDate: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 8,
        marginTop: 2,
    },
    cardDescription: {
        fontSize: 15,
        color: COLORS.textNormal,
        lineHeight: 22,
    },
});

export default NotificationScreen;