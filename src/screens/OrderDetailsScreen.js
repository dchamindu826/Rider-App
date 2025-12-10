import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { client } from '../sanity/sanityClient';
import { Ionicons } from '@expo/vector-icons';
import CustomSwipeButton from '../components/CustomSwipeButton';
import CustomButton from '../components/CustomButton';
import Toast from 'react-native-toast-message';
import CancelOrderModal from '../components/CancelOrderModal';

const formatCurrency = (amount) => {
    if (typeof amount !== 'number') { amount = parseFloat(amount) || 0; }
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const OrderDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const orderId = route.params?.orderId; 

    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [order, setOrder] = useState(null);
    const [swipeResetKey, setSwipeResetKey] = useState(0);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

    useEffect(() => {
        if (!orderId) { setIsLoading(false); return; }
        
        const query = `*[_type == "foodOrder" && _id == $orderId][0] {
            _id,
            orderStatus,
            receiverName,
            receiverContact,
            deliveryAddressText,
            foodTotal,
            deliveryCharge, 
            restaurant->{ name, "address": addressText, phone, location }
        }`;
        
        client.fetch(query, { orderId }).then(data => {
            setOrder(data);
            setIsLoading(false);
        }).catch(err => {
            setIsLoading(false);
            Toast.show({ type: 'error', text1: 'Failed to load order details' });
        });
    }, [orderId]);

    const handleCall = (number) => {
        if (!number) { Toast.show({ type: 'error', text1: 'Phone number not found!' }); return; }
        Linking.openURL(`tel:${number}`);
    };

    const handleAcceptOrder = async () => {
        setIsAccepting(true); 
        try {
            await client.patch(orderId).set({ 
                orderStatus: 'assigned',
                assignedRider: { _type: 'reference', _ref: user._id }
            }).commit();
            Toast.show({ type: 'success', text1: 'Order Accepted!' });
            navigation.navigate('Main', { screen: 'Map' });
        } catch (err) {
            setIsAccepting(false);
            setSwipeResetKey(prev => prev + 1);
            Toast.show({ type: 'error', text1: 'Failed to accept order' });
        }
    };

    const handleCancelSubmit = async (reason) => {
        setIsCancelModalVisible(false);
        setIsAccepting(true);
        try {
            await client.patch(orderId).set({
                orderStatus: 'cancelled',
                cancellationReason: reason,
                cancelledBy: { _type: 'reference', _ref: user._id }
            }).commit();
            Toast.show({ type: 'success', text1: 'Order Cancelled' });
            navigation.navigate('Main', { screen: 'Orders' });
        } catch (err) {
            setIsAccepting(false);
            Toast.show({ type: 'error', text1: 'Failed to cancel order', text2: err.message });
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color={COLORS.primaryYellow} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.emptyText}>Order not found or ID missing.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
                        <Text style={styles.goBackText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }
    
    const foodTotal = (order.foodTotal || 0);
    const fullDeliveryCharge = (order.deliveryCharge || 0);
    const grandTotalToCollect = foodTotal + fullDeliveryCharge;

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close-outline" size={30} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.title}>Confirm Order</Text>
            </View>
            
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PICKUP FROM</Text>
                    <View style={styles.addressCard}>
                        <View style={{flex: 1}}>
                            <View style={styles.addressRow}>
                                <Ionicons name="storefront-outline" size={24} color={COLORS.primaryYellow} />
                                <View style={styles.addressDetails}>
                                    <Text style={styles.addressName}>{order.restaurant?.name}</Text>
                                    <Text style={styles.addressText}>{order.restaurant?.address || 'Address not available'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.callButton} onPress={() => handleCall(order.restaurant?.phone)}>
                                <Ionicons name="call" size={18} color={COLORS.textDark} />
                                <Text style={styles.callButtonText}>Call Restaurant</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DELIVER TO</Text>
                    <View style={styles.addressCard}>
                        <View style={{flex: 1}}>
                            <View style={styles.addressRow}>
                                <Ionicons name="person-outline" size={24} color={COLORS.primaryYellow} />
                                <View style={styles.addressDetails}>
                                    <Text style={styles.addressName}>{order.receiverName}</Text>
                                    <Text style={styles.addressText}>{order.deliveryAddressText}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.callButton} onPress={() => handleCall(order.receiverContact)}>
                                <Ionicons name="call" size={18} color={COLORS.textDark} />
                                <Text style={styles.callButtonText}>Call Customer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Payment Summary (COD)</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Food Total</Text>
                        <Text style={styles.summaryValue}>LKR {formatCurrency(foodTotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Delivery Fee</Text>
                        <Text style={styles.summaryValue}>LKR {formatCurrency(fullDeliveryCharge)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total to Collect (COD)</Text>
                        <Text style={styles.totalValue}>LKR {formatCurrency(grandTotalToCollect)}</Text>
                    </View>
                </View>

                <View style={styles.earningHintCard}>
                    <Ionicons name="wallet-outline" size={24} color={COLORS.success} />
                    <View style={styles.earningHintTextBox}> 
                        <Text style={styles.earningHintText}>
                            Your earning from this ride: <Text style={{fontWeight: 'bold'}}> LKR {formatCurrency(fullDeliveryCharge * 0.65)}</Text>
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <CustomButton title="Cancel Order" onPress={() => setIsCancelModalVisible(true)} variant="secondary" style={styles.cancelButton} disabled={isAccepting} />
                <CustomSwipeButton key={swipeResetKey} title="Swipe to Accept" onSwipeSuccess={handleAcceptOrder} />
            </View>

            <CancelOrderModal isVisible={isCancelModalVisible} onClose={() => setIsCancelModalVisible(false)} onSubmit={handleCancelSubmit} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    headerContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backButton: { padding: 5 },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginLeft: 15 },
    container: { flex: 1, backgroundColor: COLORS.lightBackground, paddingHorizontal: 20, paddingTop: 20 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: COLORS.textLight },
    goBackButton: { marginTop: 20, alignSelf: 'center', padding: 10 },
    goBackText: { color: COLORS.primaryYellow, fontWeight: 'bold', fontSize: 16 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 10 },
    addressCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15 },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
    addressDetails: { flex: 1, marginLeft: 15 },
    addressName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
    addressText: { fontSize: 14, color: COLORS.textNormal, marginTop: 4, lineHeight: 20 },
    callButton: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: COLORS.lightBackground, borderRadius: 6, marginTop: 12, alignSelf: 'flex-start' },
    callButtonText: { color: COLORS.textDark, fontSize: 14, fontWeight: '600', marginLeft: 6 },
    summaryCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginTop: 10 },
    summaryTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    summaryLabel: { fontSize: 15, color: COLORS.textLight },
    summaryValue: { fontSize: 15, color: COLORS.textDark, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
    totalLabel: { fontSize: 18, color: COLORS.textDark, fontWeight: 'bold' },
    totalValue: { fontSize: 18, color: COLORS.textDark, fontWeight: 'bold' },
    earningHintCard: { backgroundColor: '#E6F7F0', borderColor: COLORS.success, borderWidth: 1, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'flex-start', marginTop: 15 },
    earningHintTextBox: { flex: 1, marginLeft: 10 },
    earningHintText: { fontSize: 14, color: COLORS.textDark, flexShrink: 1, lineHeight: 20 },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.white },
    cancelButton: { backgroundColor: COLORS.white, borderColor: COLORS.danger, borderWidth: 1, marginBottom: 15 },
});

export default OrderDetailsScreen;