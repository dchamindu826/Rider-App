// src/navigation/RiderNavigator.js
// --- FINAL FIX: (Aluth Screens 3ma Add Kala) ---

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// --- Okkoma Screens ---
import HomeScreen from '../screens/HomeScreen';
import OrderListScreen from '../screens/OrderListScreen';
import RiderMapScreen from '../screens/RiderMapScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen'; 
import WithdrawScreen from '../screens/WithdrawScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen'; 
import RiderPaymentSettingsScreen from '../screens/RiderPaymentSettingsScreen'; 
import NotificationScreen from '../screens/NotificationScreen';
// --- Aluth 3 ---
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpScreen from '../screens/HelpScreen';
import AgreementScreen from '../screens/AgreementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = ({ focused, color, size, route }) => {
  let iconName;
  if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
  if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
  else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
  else if (route.name === 'Earnings') iconName = focused ? 'wallet' : 'wallet-outline';
  else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons name={iconName} size={size} color={color} />
    </View>
  );
};

function MainRiderTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: (props) => <TabBarIcon {...props} route={route} />,
        tabBarActiveTintColor: COLORS.primaryYellow,
        tabBarInactiveTintColor: COLORS.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrderListScreen} options={{ title: 'New Orders' }} />
      <Tab.Screen name="Map" component={RiderMapScreen} options={{ title: 'Live Map' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RiderNavigator() {
    const { user, isLoading } = useAuth();
    const isAuthenticated = !!user;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryYellow} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <>
                        <Stack.Screen name="Main" component={MainRiderTabs} />
                        <Stack.Screen name="OrderDetailsScreen" component={OrderDetailsScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="WithdrawScreen" component={WithdrawScreen} options={{ presentation: 'modal' }} />
                        <Stack.Screen name="RiderPaymentSettings" component={RiderPaymentSettingsScreen} options={{ presentation: 'modal' }} />
                        
                        {/* --- ALUTH SCREEN 3 ADD KALA --- */}
                        <Stack.Screen 
                            name="EditProfileScreen" 
                            component={EditProfileScreen} 
                            options={{ presentation: 'modal' }} 
                        />
                        <Stack.Screen 
                            name="HelpScreen" 
                            component={HelpScreen} 
                            options={{ presentation: 'modal' }} 
                        />
                        <Stack.Screen 
                            name="AgreementScreen" 
                            component={AgreementScreen} 
                            options={{ presentation: 'modal' }} 
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
  tabIconContainer: { width: 24, height: 24, position: 'relative' },
  dot: { position: 'absolute', top: -2, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger, borderWidth: 1, borderColor: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }
});

export default RiderNavigator;