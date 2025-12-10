import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/RiderNavigator';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/theme/colors';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import * as Notifications from 'expo-notifications';
import { Platform, LogBox } from 'react-native'; 

// Ignore warning logs
LogBox.ignoreLogs([
  'NetworkError',
  'Cannot open, already sending',
  'EventSource'
]);

// 🚨 SOUND LOOP CONFIGURATION
const REPEAT_SOUND_COUNT = 4; // 4 times loop

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { data } = notification.request.content;

    // --- CASE 1: ORDER POOL (LOOP SOUND) ---
    // Order ekak Pool ekata watunama meka Wada karanawa
    if (data.type === 'order_pool') {
        
        // 4 Parak Schedule Karanawa
        for (let i = 0; i < REPEAT_SOUND_COUNT; i++) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: notification.request.content.title,
                    body: notification.request.content.body,
                    data: data,
                    sound: 'notification.mp3', // Rider App Sound File
                    channelId: 'order-pool', 
                },
                trigger: {
                    // Mulma eka 0.1s walin, itapasse hema 3s walatama sarayak
                    seconds: i === 0 ? 0.1 : 3 * i, 
                    repeats: false,
                },
            });
        }
        
        // Original Notification eka Silence karanawa (Double sound nathi wenna)
        return { 
          shouldShowAlert: true, 
          shouldPlaySound: false, 
          shouldSetBadge: true, 
        };
    }

    // --- CASE 2: NORMAL NOTIFICATIONS ---
    // Announcements wage dewal walata eka parai wadinne
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

const App = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // 1. Default Channel
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      
      // 2. Rider Order Pool Channel (High Priority)
      Notifications.setNotificationChannelAsync('order-pool', {
        name: 'Order Pool Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FFD700',
        sound: 'notification.mp3' // Channel ekatath sound eka denawa
      });
    }
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={COLORS.white} />
        <AppNavigator />
        <Toast />
      </SafeAreaProvider>
    </AuthProvider>
  );
};

export default App;