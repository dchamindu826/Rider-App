// src/screens/RiderMapScreen.js

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, StatusBar, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { client } from '../sanity/sanityClient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as LinkingExpo from 'expo-linking';
import CustomSwipeButton from '../components/CustomSwipeButton';
import CustomButton from '../components/CustomButton';
import Toast from 'react-native-toast-message';
import CancelOrderModal from '../components/CancelOrderModal';

const RiderMapScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const mapRef = useRef(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [riderLocation, setRiderLocation] = useState(null);
    const [swipeResetKey, setSwipeResetKey] = useState(0);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

    const fetchActiveOrder = async () => {
        try {
            const query = `*[_type == "foodOrder" && assignedRider._ref == $userId && (orderStatus == 'assigned' || orderStatus == 'onTheWay')][0] {
                _id, orderStatus, customerLocation, deliveryAddressText, receiverContact, deliveryCharge, 
                restaurant->{ name, "address": addressText, phone, location }
            }`;
            const order = await client.fetch(query, { userId: user._id });
            setCurrentOrder(order);
        } catch (err) {
            console.error(err);
        }
    };

    const startWatchingLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setRiderLocation({ latitude: 6.9271, longitude: 79.8612 });
                setIsLoading(false);
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            setRiderLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
            setIsLoading(false);
            
            Location.watchPositionAsync(
                { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 5000, distanceInterval: 10 },
                (newLocation) => {
                    const { latitude, longitude } = newLocation.coords;
                    setRiderLocation({ latitude, longitude });
                    if (user?.availability === 'online') {
                        client.patch(user._id).set({ currentLocation: { _type: 'geopoint', lat: latitude, lng: longitude } }).commit().catch(e => console.log(e));
                    }
                }
            );
        } catch (error) {
            setIsLoading(false);
            if(!riderLocation) setRiderLocation({ latitude: 6.9271, longitude: 79.8612 });
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            setIsLoading(true);
            fetchActiveOrder();
            startWatchingLocation();
        }, [])
    );

    const handleNavigateToLocation = () => {
        if (!currentOrder) return;
        let destinationQuery = '';
        if (currentOrder.orderStatus === 'assigned') {
            const loc = currentOrder.restaurant?.location;
            if (loc?.lat && loc?.lng) destinationQuery = `${loc.lat},${loc.lng}`;
            else { Toast.show({ type: 'error', text1: 'No location' }); return; }
        } else if (currentOrder.orderStatus === 'onTheWay') {
            const loc = currentOrder.customerLocation;
            if (loc?.lat && loc?.lng) destinationQuery = `${loc.lat},${loc.lng}`;
            else { Toast.show({ type: 'error', text1: 'No location' }); return; }
        }
        LinkingExpo.openURL(`google.navigation:q=${destinationQuery}`);
    };

    const handleCall = (number) => {
        if (!number) return Toast.show({ type: 'error', text1: 'No number' });
        Linking.openURL(`tel:${number}`);
    };

    // ... kalin imports ...

    // --- FIX 1: Local State Update (Ekapara UI eka maru wenna) ---
    const handleCollected = async () => {
        setIsUpdatingStatus(true);
        try {
            // 1. Server eka update karanawa
            await client.patch(currentOrder._id).set({ orderStatus: 'onTheWay' }).commit();
            
            // 2. UI eka kelinma update karanawa (Fetch wenakan inne na)
            setCurrentOrder(prev => ({
                ...prev,
                orderStatus: 'onTheWay'
            }));

            // 3. Button eka aluth karanna (Next step ekata)
            setSwipeResetKey(prev => prev + 1);
            Toast.show({ type: 'success', text1: 'Status Updated', text2: 'Head to the customer!' });

        } catch (err) { 
            Toast.show({ type: 'error', text1: 'Failed to update status' });
            setSwipeResetKey(prev => prev + 1); // Error awath button reset karanawa
        } finally { 
            setIsUpdatingStatus(false); 
        }
    };

    const handleCompleted = async () => {
        setIsUpdatingStatus(true);
        const earning = (currentOrder.deliveryCharge || 0) * 0.70;
        try {
            const tx = client.transaction();
            tx.patch(currentOrder._id, p => p.set({ orderStatus: 'completed' }));
            tx.patch(user._id, p => p.setIfMissing({ walletBalance: 0 }).inc({ walletBalance: earning }));
            await tx.commit();
            
            // 4. Order eka iwarai, Home ekata yanna
            setCurrentOrder(null);
            navigation.navigate('Home'); 
            
        } catch (err) { 
            Toast.show({ type: 'error', text1: 'Failed to complete order' });
            setSwipeResetKey(prev => prev + 1); 
        } finally { 
            setIsUpdatingStatus(false); 
        }
    };


    const handleCancelSubmit = async (reason) => {
        setIsCancelModalVisible(false);
        setIsUpdatingStatus(true);
        try {
            await client.patch(currentOrder._id).set({
                orderStatus: 'cancelled', cancellationReason: reason, cancelledBy: { _type: 'reference', _ref: user._id }
            }).commit();
            setCurrentOrder(null);
            navigation.navigate('Main', { screen: 'Orders' });
        } catch (err) { setIsUpdatingStatus(false); }
    };

    if (isLoading || !riderLocation) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryYellow} />
                </View>
            </SafeAreaView>
        );
    }

    if (!currentOrder) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <MapView provider={MapView.PROVIDER_GOOGLE} style={styles.map} initialRegion={{ ...riderLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }}>
                    <Marker coordinate={riderLocation} title="You" />
                </MapView>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No Active Deliveries</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <MapView ref={mapRef} style={styles.map} provider={MapView.PROVIDER_GOOGLE} initialRegion={{ ...riderLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }}>
                <Marker coordinate={riderLocation} title="You" pinColor={COLORS.primaryYellow} />
                {currentOrder.orderStatus === 'assigned' && currentOrder.restaurant?.location ? (
                    <Marker coordinate={{ latitude: currentOrder.restaurant.location.lat, longitude: currentOrder.restaurant.location.lng }} title="Restaurant" />
                ) : null}
                {currentOrder.orderStatus === 'onTheWay' && currentOrder.customerLocation ? (
                    <Marker coordinate={{ latitude: currentOrder.customerLocation.lat, longitude: currentOrder.customerLocation.lng }} title="Customer" />
                ) : null}
            </MapView>

            <View style={styles.footer}>
                <Text style={styles.footerTitle}>{currentOrder.orderStatus === 'assigned' ? 'Go to Restaurant' : 'Go to Customer'}</Text>
                <Text style={styles.footerAddress} numberOfLines={1}>{currentOrder.orderStatus === 'assigned' ? currentOrder.restaurant?.address : currentOrder.deliveryAddressText}</Text>
                
                <TouchableOpacity style={styles.navButton} onPress={handleNavigateToLocation}>
                    <Text style={styles.navButtonText}>Get Directions</Text>
                </TouchableOpacity>

                <View style={styles.row}>
                    <TouchableOpacity style={styles.callButton} onPress={() => handleCall(currentOrder.restaurant?.phone)}>
                        <Text style={styles.btnText}>Restaurant</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callButton} onPress={() => handleCall(currentOrder.receiverContact)}>
                        <Text style={styles.btnText}>Customer</Text>
                    </TouchableOpacity>
                </View>

                <CustomButton 
                    title="Cancel Order" 
                    onPress={() => setIsCancelModalVisible(true)} 
                    variant="secondary" 
                    style={{marginBottom: 10}} 
                />

                {currentOrder.orderStatus === 'assigned' ? (
                    <CustomSwipeButton key={swipeResetKey} title="Swipe to Collect" onSwipeSuccess={handleCollected} />
                ) : (
                    <CustomSwipeButton key={swipeResetKey} title="Swipe to Complete" onSwipeSuccess={handleCompleted} />
                )}
            </View>
            <CancelOrderModal isVisible={isCancelModalVisible} onClose={() => setIsCancelModalVisible(false)} onSubmit={handleCancelSubmit} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    map: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 20, borderRadius: 10 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold' },
    footer: { backgroundColor: COLORS.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
    footerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    footerAddress: { fontSize: 14, color: '#555', marginBottom: 15 },
    navButton: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
    navButtonText: { color: '#fff', fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    callButton: { flex: 0.48, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, alignItems: 'center' },
    btnText: { fontWeight: 'bold' }
});

export default RiderMapScreen;