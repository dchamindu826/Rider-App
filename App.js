// App.js

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator, { navigationRef } from './src/navigation/RiderNavigator'; // navigationRef එක import කළා
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/theme/colors';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import * as Notifications from 'expo-notifications';
import { Platform, LogBox } from 'react-native'; 

LogBox.ignoreLogs([
  'NetworkError',
  'Cannot open, already sending',
  'EventSource',
  'expo-notifications'
]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const App = () => {
  useEffect(() => {
    // Android Channels setup
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      
      Notifications.setNotificationChannelAsync('order-pool', {
        name: 'Order Pool Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FFD700',
        sound: 'notification.mp3' 
      });
    }

   
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification clicked, redirecting...");
      
      // Navigation 
      if (navigationRef.isReady()) {
        navigationRef.navigate('NotificationScreen');
      }
    });

    return () => {
      // Listener 
      Notifications.removeNotificationSubscription(responseListener);
    };
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