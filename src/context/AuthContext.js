// src/context/AuthContext.js (Rider App)
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { client } from '../sanity/sanityClient';
// 1. Import එක දාගන්න
import { registerForPushNotificationsAsync } from '../utils/notificationService';

const AuthContext = createContext(null);
const STORAGE_KEY = 'riderData';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Token Update Function එක
  const updatePushToken = async (userId) => {
      try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
              await client.patch(userId).set({ pushToken: token }).commit();
              console.log("Rider Push Token Updated!");
          }
      } catch (error) {
          console.error("Failed to update rider push token:", error);
      }
  };

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const userDataString = await AsyncStorage.getItem(STORAGE_KEY);
        if (userDataString) {
          const storedUser = JSON.parse(userDataString);
          const freshUser = await client.fetch(`*[_type == "rider" && _id == $userId][0]`, { userId: storedUser._id });

          if (freshUser) {
            setUser(freshUser);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
            // 3. Auto Login වෙද්දිත් Token එක යවන්න
            updatePushToken(freshUser._id);
          } else {
            await logout();
          }
        }
      } catch (e) {
        console.error("Failed to load user", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserFromStorage();
  }, []);

  const login = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      // 4. Login වෙද්දි Token එක යවන්න
      updatePushToken(userData._id);
    } catch (e) {
      console.error("Failed to save user", e);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to remove user", e);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryYellow} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }
});