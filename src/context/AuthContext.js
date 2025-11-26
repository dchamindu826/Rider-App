// src/context/AuthContext.js
// --- FIXED: Uses 'riderData' key instead of 'userData' ---

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { client } from '../sanity/sanityClient';

const AuthContext = createContext(null);
const STORAGE_KEY = 'riderData'; // --- (!!!) ALUTH UNIQUE KEY EKA (!!!) ---

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const userDataString = await AsyncStorage.getItem(STORAGE_KEY); // Aluth key eka use karanawa
        if (userDataString) {
          const storedUser = JSON.parse(userDataString);
          
          // Rider-ge aluth data fetch karagannawa
          const query = `*[_type == "rider" && _id == $userId][0]`;
          const freshUser = await client.fetch(query, { userId: storedUser._id });

          if (freshUser) {
            setUser(freshUser);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
          } else {
            await logout();
          }
        }
      } catch (e) {
        console.error("Failed to load user from storage", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserFromStorage();
  }, []);

  const login = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); // Aluth key eka use karanawa
    } catch (e) {
      console.error("Failed to save user to storage", e);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEY); // Aluth key eka use karanawa
    } catch (e) {
      console.error("Failed to remove user from storage", e);
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  }
});