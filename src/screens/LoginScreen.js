// src/screens/LoginScreen.js
// --- FINAL: Uses 'username' to match your schema ---

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, StatusBar } from 'react-native';
import { COLORS } from '../theme/colors';
import CustomButton from '../components/CustomButton';
import CustomTextInput from '../components/CustomTextInput';
import { client } from '../sanity/sanityClient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const logoPath = require('../../assets/images/logo.png'); 

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({ type: 'error', text1: 'Missing Fields' });
      return;
    }
    setIsLoading(true);

    try {
      const query = `*[_type == "rider" && username.current == $username && password == $password][0]`;
      const params = { 
        username: username,
        password: password 
      };
      const riderUser = await client.fetch(query, params);

      if (riderUser) {
        setIsLoading(false);
        Toast.show({ 
          type: 'success', 
          text1: 'Rider Login Successful!', 
          text2: `Welcome back, ${riderUser.fullName || riderUser.username.current}` 
        });
        login(riderUser);
      } else {
        setIsLoading(false);
        Toast.show({ type: 'error', text1: 'Login Failed', text2: 'Invalid username or password.' });
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Rider login error:', err.message);
      Toast.show({ type: 'error', text1: 'Error', text2: 'An unknown error occurred.' });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        
        <View style={styles.headerContainer}>
          <Image source={logoPath} style={styles.logoImage} />
          <Text style={styles.title}>Rider Login</Text>
          <Text style={styles.subtitle}>Start accepting deliveries</Text>
        </View>

        <View style={styles.inputSection}>
          <CustomTextInput
            iconName="person-outline"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <CustomTextInput
            iconName="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => Toast.show({type: 'info', text1: 'Contact Admin', text2: 'Please contact admin to reset password.'})}>
            <Text style={styles.forgotPasswordText}>Need Help?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonSection}>
          <CustomButton 
            title={isLoading ? "Logging in..." : "Login"} 
            onPress={handleLogin} 
            disabled={isLoading} 
          />
          {isLoading && <ActivityIndicator size="large" color={COLORS.primaryYellow} />}
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>New rider? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Register here</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 25 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  logoImage: { width: 300, height: 250, resizeMode: 'contain', marginBottom: -35 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 5 },
  subtitle: { fontSize: 16, color: COLORS.textLight },
  inputSection: { marginBottom: 10 },
  forgotPasswordButton: { alignSelf: 'flex-end', marginVertical: 5 },
  forgotPasswordText: { color: COLORS.textNormal, fontSize: 14 },
  buttonSection: { marginTop: 10 },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { fontSize: 14, color: COLORS.textLight },
  registerText: { fontSize: 14, color: COLORS.primaryYellow, fontWeight: 'bold' },
});

export default LoginScreen;