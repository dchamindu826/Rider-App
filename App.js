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
  'EventSource',
  'expo-notifications' // Deprecation warnings ignore karanna
]);

// --- FIX: Notification handler eka simple kala ---
// Dan loop wenne na, eka notification ekak witharak pennanawa
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
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
      
      // 2. Rider Order Pool Channel (Sound eka meken enawa)
      Notifications.setNotificationChannelAsync('order-pool', {
        name: 'Order Pool Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FFD700',
        sound: 'notification.mp3' 
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