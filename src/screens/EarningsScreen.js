// src/screens/EarningsScreen.js
// --- FINAL CLEAN VERSION ---

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { client } from '../sanity/sanityClient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const EarningsScreen = () => {
 const navigation = useNavigation();
const { user } = useAuth();
 
 const [isLoading, setIsLoading] = useState(true);
 const [walletBalance, setWalletBalance] = useState(0);
 const [history, setHistory] = useState([]);

 const fetchData = async () => {
 setIsLoading(true);
 try {
  const query = `
 {
 "wallet": *[_type == "rider" && _id == $userId][0].walletBalance,
 "history": *[_type == "withdrawalRequest" && rider._ref == $userId] | order(_createdAt desc)
 }
 `;
 const data = await client.fetch(query, { userId: user._id });
 setWalletBalance(data.wallet || 0);
 setHistory(data.history || []);
 } catch (err) {
 console.error("Fetch earnings error:", err);
 Toast.show({ type: 'error', text1: 'Failed to load data' });
 } finally {
 setIsLoading(false);
 }
 };

 useFocusEffect(useCallback(() => { fetchData(); }, [user]));

 const getStatusColor = (status) => {
     if (status === 'completed') return COLORS.success;
 if (status === 'declined') return COLORS.danger;
 return COLORS.primaryYellow; // pending
 };

 const renderHistoryItem = ({ item }) => (
 <View style={styles.historyItem}>
 <View style={[styles.historyIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
 <Ionicons name={item.status === 'completed' ? 'checkmark-circle' : 'hourglass-outline'} size={24} color={getStatusColor(item.status)} />
 </View>
 <View style={styles.historyDetails}>
 <Text style={styles.historyAmount}>LKR {item.amount.toFixed(2)}</Text>
 <Text style={styles.historyDate}>{new Date(item._createdAt).toLocaleDateString()}</Text>
 </View>
 <Text style={[styles.historyStatus, { color: getStatusColor(item.status) }]}>
 {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
 </Text>
 </View>
 );

 const renderListHeader = () => (
 <View>
 {/* --- Current Balance --- */}
 <View style={styles.walletCard}>
 <Text style={styles.walletLabel}>Available to Withdraw</Text>
<Text style={styles.walletAmount}>LKR {walletBalance.toFixed(2)}</Text>
 <TouchableOpacity 
 style={styles.withdrawButton}
 onPress={() => navigation.navigate('WithdrawScreen', { balance: walletBalance })}
 >
 <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
 </TouchableOpacity>
 </View>
 
 {/* --- Withdrawal History Title --- */}
 <Text style={styles.sectionTitle}>Withdrawal History</Text>
 </View>
 );

 return (
 <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
 <View style={styles.headerContainer}>
 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
 <Ionicons name="arrow-back-outline" size={30} color={COLORS.textDark} />
 </TouchableOpacity>
 <Text style={styles.title}>My Earnings</Text>
 </View>

 {isLoading ? (
 <View style={styles.loadingContainer}>
 <ActivityIndicator size="large" color={COLORS.primaryYellow} />
 </View>
 ) : (
 <FlatList
 style={styles.container}
 data={history}
 keyExtractor={(item) => item._id}
 renderItem={renderHistoryItem}
 ListHeaderComponent={renderListHeader}
 ListEmptyComponent={<Text style={styles.emptyText}>No withdrawal history found.</Text>}
 contentContainerStyle={{ paddingBottom: 20 }}
 />
 )}
 </SafeAreaView>
 );
};

const styles = StyleSheet.create({
 safeArea: { flex: 1, backgroundColor: COLORS.lightBackground },
 headerContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white },
 backButton: { padding: 5 },
 title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginLeft: 15 },
 loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
 container: { 
 flex: 1, 
 paddingHorizontal: 20,
 paddingTop: 20,
 },
 walletCard: {
backgroundColor: COLORS.white,
 borderRadius: 12,
 padding: 20,
 alignItems: 'center',
 elevation: 3,
 shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
 marginBottom: 30,
 },
walletLabel: { fontSize: 16, color: COLORS.textLight },
 walletAmount: { fontSize: 32, fontWeight: 'bold', color: COLORS.textDark, marginVertical: 10 },
 withdrawButton: {
 backgroundColor: COLORS.primaryYellow,
 paddingHorizontal: 25,
 paddingVertical: 12,
 borderRadius: 8,
 },
 withdrawButtonText: {
 color: COLORS.yellowButtonText,
 fontSize: 16,
 fontWeight: 'bold',
 },
 sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
 historyItem: {
  flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: COLORS.white,
 padding: 15,
 borderRadius: 8,
 marginBottom: 10,
 },
 historyIcon: {
 width: 40,
 height: 40,
 borderRadius: 20,
 justifyContent: 'center',
 alignItems: 'center',
 marginRight: 15,
 },
 historyDetails: {
 flex: 1,
 },
 historyAmount: {
 fontSize: 16,
 fontWeight: 'bold',
 color: COLORS.textDark,
 },
 historyDate: {
 fontSize: 12,
 color: COLORS.textLight,
 },
 historyStatus: {
 fontSize: 14,
 fontWeight: 'bold',
 },
 emptyText: {
 textAlign: 'center',
 color: COLORS.textLight,
 marginTop: 20,
 }
});

export default EarningsScreen;