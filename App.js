// App.js
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import RiderNavigator from './src/navigation/RiderNavigator';
import Toast from 'react-native-toast-message';
import { COLORS } from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={COLORS.white} />
      <AuthProvider>
        <RiderNavigator />
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}