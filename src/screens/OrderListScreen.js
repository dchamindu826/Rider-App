// src/screens/OrderListScreen.js
// --- FINAL FIX: (Padding Bottom Added for Tab Bar) ---

import React, { useState, useCallback, useRef } from 'react';
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

// Comma danna function eka
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') { amount = parseFloat(amount) || 0; }
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const OrderListScreen = () => {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const pollerRef = useRef(null); // Poller eka save karanna

    const fetchOrders = async () => {
        // Refresh weddi loading icon eka pennanna
        if (orders.length === 0) {
            setIsLoading(true);
        }
        try {
            const query = `
            *[_type == "foodOrder" && orderStatus == "readyForPickup"] {
                _id,
                deliveryCharge, 
                restaurant->{ name, address, location } // Location one wei map ekata
            }
            `;
            const data = await client.fetch(query);
            setOrders(data);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to load orders' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Auto-Refresh Poller Eka ---
    useFocusEffect(
        useCallback(() => {
            fetchOrders();
            pollerRef.current = setInterval(() => {
                fetchOrders(); 
            }, 10000); // Thappara 10

            return () => clearInterval(pollerRef.current);
        }, [])
    );

    const handleOrderPress = (orderId) => {
        navigation.navigate('OrderDetailsScreen', { orderId: orderId });
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.orderCard} 
            onPress={() => handleOrderPress(item._id)}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="receipt-outline" size={30} color={COLORS.primaryYellow} />
            </View>
            <View style={styles.orderDetails}>
                <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
                <Text style={styles.restaurantAddress}>{item.restaurant?.address}</Text>
                
                <Text style={styles.earningText}>
                    Your Earning: LKR {formatCurrency((item.deliveryCharge || 0) * 0.65)}
                </Text>
            </View>
            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward-outline" size={24} color={COLORS.textLight} />
            </View>
        </TouchableOpacity>
    );

    if (isLoading && orders.length === 0) { 
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color={COLORS.primaryYellow} style={styles.loader} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>New Orders</Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No new orders available right now.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContainer}
                    onRefresh={fetchOrders} // Pull to refresh
                    refreshing={isLoading}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.lightBackground },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { fontSize: 16, color: COLORS.textLight, textAlign: 'center' },
    
    // --- (FIX) MEKA THAMA WENAS KALE ---
    listContainer: { 
        padding: 15,
        paddingBottom: 100 // Tab bar ekata yata wenne nathi wenna ida dunna
    },
    
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: { marginRight: 15 },
    orderDetails: { flex: 1 },
    restaurantName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
    restaurantAddress: { fontSize: 14, color: COLORS.textNormal, marginVertical: 4 },
    earningText: { fontSize: 15, fontWeight: 'bold', color: COLORS.success, marginTop: 5 },
    arrowContainer: { marginLeft: 10 },
});

export default OrderListScreen;