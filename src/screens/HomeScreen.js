// src/screens/HomeScreen.js
// --- FINAL FIX: Added Sound Loop & Stop Logic ---

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Image, 
    ActivityIndicator, Platform, StatusBar, 
    ScrollView, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { client, urlFor } from '../sanity/sanityClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import NewOrderPopup from '../components/NewOrderPopup'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av'; // 1. Audio Import Kara

const LAST_READ_ANNOUNCEMENT_KEY = 'lastReadAnnouncementId';

// Comma danna function eka
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') { amount = parseFloat(amount) || 0; }
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const placeholderImage = 'https://placehold.co/100x100/e0e0e0/b0b0b0?text=Rider';

const ActionButton = ({ icon, title, onPress, badge }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={styles.actionIconContainer}>
      <Ionicons name={icon} size={30} color={COLORS.primaryYellow} />
      {badge > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const { user, login } = useAuth();
  const navigation = useNavigation();
  
  const [isOnline, setIsOnline] = useState(user?.availability === 'online');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ wallet: 0, pendingOrders: 0, recentOrders: [] });
  
  const [hasActiveRide, setHasActiveRide] = useState(false);
  const [newOrder, setNewOrder] = useState(null); 
  const [seenOrderIds, setSeenOrderIds] = useState([]);
  const pollerRef = useRef(null); 
  const [refreshing, setRefreshing] = useState(false); 
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false); 

  // 2. Sound Reference
  const soundRef = useRef(null);

  // --- 3. SOUND FUNCTIONS ADDED ---
  const playAlertSound = async () => {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/notification.mp3'), // Make sure this file exists
        { isLooping: true, shouldPlay: true }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.log("Sound Error:", error);
    }
  };

  const stopAlertSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  const fetchData = async () => {
    try {
      const lastReadId = await AsyncStorage.getItem(LAST_READ_ANNOUNCEMENT_KEY);

      const query = `
        {
          "wallet": *[_type == "rider" && _id == $userId][0].walletBalance,
          "pendingOrders": count(*[_type == "foodOrder" && orderStatus == "readyForPickup"]),
          "recentOrders": *[_type == "foodOrder" && assignedRider._ref == $userId && orderStatus == "completed"] | order(_updatedAt desc) [0...3] {
              _id, _updatedAt,
              customer->{ fullName },
              deliveryCharge
          },
          "newestAnnouncementId": *[_type == "announcement" && (target == 'all' || target == 'riders')] | order(createdAt desc) [0]._id,
          "activeRide": count(*[_type == "foodOrder" && assignedRider._ref == $userId && (orderStatus == 'assigned' || orderStatus == 'onTheWay')])
        }
      `;
      const data = await client.fetch(query, { userId: user._id });
      
      setStats({
        wallet: data.wallet || 0,
        pendingOrders: data.pendingOrders || 0,
        recentOrders: data.recentOrders || [],
      });
      setHasActiveRide(data.activeRide > 0);
      
      if (data.newestAnnouncementId && data.newestAnnouncementId !== lastReadId) {
        setHasUnreadNotifications(true);
      } else {
        setHasUnreadNotifications(false);
      }
      
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to refresh data' });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData();
      return () => {
          stopAlertSound(); // Cleanup sound on blur
      };
    }, [user])
  );
  
    const pollForOrders = async () => {
        if (newOrder || hasActiveRide) return; 
        try {
            const query = `
                *[_type == "foodOrder" && 
                  orderStatus == "readyForPickup" && 
                  !(_id in $seenOrderIds)] | order(_createdAt asc)[0] {
                    _id, 
                    grandTotal, 
                    deliveryCharge, 
                    foodTotal, 
                    receiverName,
                    restaurant->{ 
                        name, 
                        "address": addressText
                    }
                }
            `;
            const orderData = await client.fetch(query, { seenOrderIds });
            if (orderData) {
                setNewOrder(orderData);
                setSeenOrderIds(prev => [...prev, orderData._id]);
                playAlertSound(); // 4. Play Sound when Poller finds order
            }
        } catch (err) { console.log("Polling error: ", err); }
    };

  // Listener Logic
  // Listener Logic
  useEffect(() => {
    if (isOnline && !hasActiveRide) {
        pollerRef.current = setInterval(pollForOrders, 5000); 
        
        // --- FIX: Query eken parameter eka ain kala ---
        // Listener eka run wenne aluth order ekak 'appear' unoth witharai.
        // Filter kirima pollForOrders() athule wenawa.
        const subscription = client.listen(
            `*[_type == "foodOrder" && orderStatus == "readyForPickup"]`
        ).subscribe(update => {
            if (update.transition === 'appear' && !newOrder) {
                 console.log("New order detected by listener!");
                 pollForOrders(); // Trigger poll immediately
            }
        });
        
        return () => {
            clearInterval(pollerRef.current);
            subscription.unsubscribe();
            stopAlertSound(); // Cleanup sound
        };
    } else {
        if (pollerRef.current) clearInterval(pollerRef.current);
        stopAlertSound();
    }
  }, [isOnline, seenOrderIds, newOrder, hasActiveRide]);
  
  const handleAcceptOrder = () => {
    stopAlertSound(); // 5. Stop Sound on Accept
    const orderId = newOrder._id;
    setNewOrder(null);
    navigation.navigate('OrderDetailsScreen', { orderId: orderId });
  };
  
  const handleIgnoreOrder = () => {
    stopAlertSound(); // 6. Stop Sound on Ignore
    setNewOrder(null); 
  };
  
  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus); 
    
    try {
      const updatedUser = await client
        .patch(user._id)
        .set({ availability: newStatus ? 'online' : 'offline' })
        .commit();
      
      login(updatedUser); 
      Toast.show({ type: 'success', text1: newStatus ? 'You are now ONLINE' : 'You are now OFFLINE' });
      if (newStatus) { 
        setSeenOrderIds([]);
        fetchData(); 
      } else {
          stopAlertSound(); // Stop sound if going offline
      }
    } catch (err) {
      setIsOnline(!newStatus);
      Toast.show({ type: 'error', text1: 'Status update failed' });
    }
  };

  const logoUrl = user?.faceImage ? urlFor(user.faceImage).width(200).url() : placeholderImage;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryYellow} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightBackground} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: logoUrl }} style={styles.profileImage} />
          <View>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.riderName}>{user?.fullName || 'Rider'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => {
                setHasUnreadNotifications(false); 
                navigation.navigate('NotificationScreen');
            }} 
            style={styles.profileIcon}
          >
            <Ionicons name="notifications-outline" size={26} color={COLORS.textDark} />
            {hasUnreadNotifications && <View style={styles.notificationDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileIcon}>
            <Ionicons name="settings-outline" size={26} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        <Text style={styles.sectionTitle}>Your Status</Text>
        <TouchableOpacity 
          style={[styles.toggleCard, isOnline ? styles.toggleOnline : styles.toggleOffline]}
          onPress={handleToggleOnline}
          activeOpacity={0.7}
        >
          <View style={styles.toggleTextContainer}>
            <Text style={isOnline ? styles.toggleTextOnline : styles.toggleTextOffline}>
              {isOnline ? "You are Online" : "You are Offline"}
            </Text>
            <Text style={isOnline ? styles.toggleSubTextOnline : styles.toggleSubTextOffline}>
              {isOnline ? "Tap to go offline and stop receiving orders" : "Tap to go online and start receiving orders"}
            </Text>
          </View>
          <Ionicons 
            name={isOnline ? "pause-circle" : "play-circle"} 
            size={40} 
            color={isOnline ? COLORS.yellowButtonText : COLORS.primaryYellow} 
          />
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Wallet Balance</Text>
            <Text style={styles.statValue}>LKR {formatCurrency(stats.wallet)}</Text>
          </View>
          <View style={[styles.statBox, {marginLeft: 10}]}>
            <Text style={styles.statLabel}>Pending Orders</Text>
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton 
            icon="receipt-outline" 
            title="Order Pool" 
            onPress={() => navigation.navigate('Orders')}
            badge={stats.pendingOrders}
          />
          <ActionButton 
            icon="wallet-outline" 
            title="My Earnings" 
            onPress={() => navigation.navigate('Earnings')} 
          />
          <ActionButton 
            icon="map-outline" 
            title="Live Map" 
            onPress={() => navigation.navigate('Map')} 
          />
          <ActionButton 
            icon="help-buoy-outline" 
            title="Help & Support" 
            onPress={() => navigation.navigate('HelpScreen')} 
          />
        </View>
        
        <Text style={styles.sectionTitle}>Recent Deliveries</Text>
        {stats.recentOrders.length > 0 ? (
          stats.recentOrders.map(order => (
            <View key={order._id} style={styles.recentOrderCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <View style={styles.recentOrderDetails}>
                <Text style={styles.recentOrderCustomer}>
                  Order for {order.customer?.fullName || 'a customer'}
                </Text>
                <Text style={styles.recentOrderDate}>
                  {new Date(order._updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.recentOrderPrice}>
                LKR {formatCurrency((order.deliveryCharge || 0) * 0.65)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRecentText}>No completed deliveries yet.</Text>
        )}

      </ScrollView>

      <NewOrderPopup 
        isVisible={!!newOrder}
        order={newOrder}
        onAccept={handleAcceptOrder}
        onIgnore={handleIgnoreOrder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightBackground },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.lightBackground },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textLight },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 20, backgroundColor: COLORS.lightBackground },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 45, height: 45, borderRadius: 22.5, marginRight: 15, backgroundColor: COLORS.border },
  welcomeText: { fontSize: 16, color: COLORS.textLight },
  riderName: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  profileIcon: { padding: 5, marginLeft: 10 },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.lightBackground
  },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 15, marginTop: 15 },
  
  toggleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  toggleOnline: { backgroundColor: COLORS.primaryYellow },
  toggleOffline: { backgroundColor: COLORS.white },
  toggleTextContainer: { flex: 1, marginRight: 15 },
  toggleTextOnline: { fontSize: 18, fontWeight: 'bold', color: COLORS.yellowButtonText },
  toggleTextOffline: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  toggleSubTextOnline: { fontSize: 14, color: COLORS.yellowButtonText, opacity: 0.9, marginTop: 4 },
  toggleSubTextOffline: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: COLORS.white, padding: 20, borderRadius: 12, alignItems: 'flex-start', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  statLabel: { fontSize: 14, color: COLORS.textLight, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, alignItems: 'flex-start', width: '48%', marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  actionIconContainer: { width: 40, height: 40, justifyContent: 'center' },
  actionButtonText: { marginTop: 10, fontSize: 15, fontWeight: 'bold', color: COLORS.textDark },
  badgeContainer: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.danger, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, borderWidth: 1, borderColor: COLORS.white },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },

  recentOrderCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  recentOrderDetails: { flex: 1, marginLeft: 15 },
  recentOrderCustomer: { fontSize: 15, fontWeight: 'bold', color: COLORS.textNormal },
  recentOrderDate: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  recentOrderPrice: { fontSize: 15, fontWeight: 'bold', color: COLORS.textDark },
  emptyRecentText: { textAlign: 'center', color: COLORS.textLight, marginVertical: 20 }
});

export default HomeScreen;