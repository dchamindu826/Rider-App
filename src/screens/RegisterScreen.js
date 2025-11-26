// src/screens/RegisterScreen.js
// --- FINAL: Uses CustomModalPicker ---

import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Image, 
  ActivityIndicator, StatusBar, Alert 
} from 'react-native';
import { COLORS } from '../theme/colors';
import CustomButton from '../components/CustomButton';
import CustomTextInput from '../components/CustomTextInput';
import { client } from '../sanity/sanityClient';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// --- (1) Aluth Picker eka Import ---
import CustomModalPicker from '../components/CustomModalPicker'; 

const RegisterScreen = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [imageAsset, setImageAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  // (pickImage, handleRegister functions - wenasak na)
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setFaceImage(imageUri);
      setImageAsset(null);
      Toast.show({ type: 'info', text1: 'Uploading Image...' });
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const uploadedAsset = await client.assets.upload('image', blob);
        setImageAsset(uploadedAsset);
        Toast.show({ type: 'success', text1: 'Image Uploaded!' });
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Image Upload Failed' });
        setFaceImage(null);
      }
    }
  };
  const handleRegister = async () => {
    if (!fullName || !username || !password || !phone || !vehicleType || !imageAsset) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all details and upload an image.' });
      return;
    }
    setIsLoading(true);
    try {
      const newRider = {
        _type: 'rider',
        fullName: fullName,
        username: { _type: 'slug', current: username },
        password: password,
        phone: phone,
        vehicleType: vehicleType,
        faceImage: {
          _type: 'image',
          asset: { _type: 'reference', _ref: imageAsset._id, },
        },
        availability: 'offline',
        hasInsulatedBag: false,
        serviceAreas: [],
        walletBalance: 0, // Aluth wallet eka
      };
      await client.create(newRider);
      setIsLoading(false);
      Alert.alert(
        'Registration Successful!',
        'Your account is pending approval. An Admin will contact you shortly.'
      );
      navigation.navigate('Login');
    } catch (err) {
      setIsLoading(false);
      console.error('Rider registration error:', err.message);
      if (err.message.includes('already exists')) {
        Toast.show({ type: 'error', text1: 'Registration Failed', text2: 'This username is already taken.' });
      } else {
        Toast.show({ type: 'error', text1: 'Registration Failed', text2: err.message || 'An unknown error occurred.' });
      }
    }
  };
  // --- (End functions) ---

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back-outline" size={30} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.title}>Register as a Rider</Text>
          </View>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {faceImage ? (
              <Image source={{ uri: faceImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderIcon}>
                <Ionicons name="camera-outline" size={50} color={COLORS.textLight} />
                <Text style={styles.imageUploadText}>Upload Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <CustomTextInput iconName="person-outline" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
          <CustomTextInput iconName="at-outline" placeholder="Username (for login)" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <CustomTextInput iconName="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <CustomTextInput iconName="call-outline" placeholder="Phone Number (07...)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          
          {/* --- (2) Aluth Custom Picker eka --- */}
          <CustomModalPicker
            placeholder="Select Vehicle Type..."
            items={[
              { label: 'Motorbike', value: 'Motorbike' },
              { label: 'Three-wheeler', value: 'Three-wheeler' },
              { label: 'Van', value: 'Van' },
              { label: 'Lorry', value: 'Lorry' },
            ]}
            selectedValue={vehicleType}
            onValueChange={(value) => setVehicleType(value)}
          />

          <View style={styles.buttonSection}>
            <CustomButton title={isLoading ? "Registering..." : "Register"} onPress={handleRegister} disabled={isLoading} />
            {isLoading && <ActivityIndicator size="large" color={COLORS.primaryYellow} />}
          </View>
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginText}>Login here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Styles (Picker container ayin kala) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  headerContainer: { alignItems: 'center', marginBottom: 20, position: 'relative', width: '100%' },
  backButton: { position: 'absolute', left: -10, top: 10, padding: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.textDark, marginTop: 10 },
  imagePicker: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.lightBackground, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, overflow: 'hidden', alignSelf: 'center' },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderIcon: { justifyContent: 'center', alignItems: 'center' },
  imageUploadText: { fontSize: 12, color: COLORS.textLight, marginTop: 5 },
  buttonSection: { marginTop: 20 },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: COLORS.textLight },
  loginText: { fontSize: 14, color: COLORS.primaryYellow, fontWeight: 'bold' },
});

export default RegisterScreen;