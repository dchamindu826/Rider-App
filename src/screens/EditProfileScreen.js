// src/screens/EditProfileScreen.js
// --- FINAL FIX: AsyncStorage Error Resolved ---

import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Platform, 
    StatusBar, TouchableOpacity, ActivityIndicator, 
    KeyboardAvoidingView, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { client, urlFor } from '../sanity/sanityClient';
import CustomButton from '../components/CustomButton';
import CustomTextInput from '../components/CustomTextInput';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, login } = useAuth(); 
    
    // --- 1. Basic Fields ---
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
    const [idNumber, setIdNumber] = useState(user?.idNumber || '');

    // --- 2. Image States (URI for preview) ---
    const [profileImage, setProfileImage] = useState(null);
    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [licenseFront, setLicenseFront] = useState(null);
    const [licenseBack, setLicenseBack] = useState(null);
    const [insurance, setInsurance] = useState(null);
    const [revenueLicense, setRevenueLicense] = useState(null);

    const [isSaving, setIsSaving] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    const pickImage = async (setImageState) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageState(result.assets[0].uri);
        }
    };

    const uploadToSanity = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const asset = await client.assets.upload('image', blob);
            return asset._id;
        } catch (error) {
            console.error("Upload failed", error);
            throw new Error("Image upload failed");
        }
    };

    const handleSave = async () => {
        if (!fullName || !phone || !vehicleNumber || !idNumber) {
            Toast.show({ type: 'error', text1: 'Missing Basic Details' });
            return;
        }
        setIsSaving(true);
        setUploadStatus('Updating details...');

        try {
            let patchObject = {
                fullName,
                phone,
                vehicleNumber,
                idNumber
            };

            if (profileImage) {
                setUploadStatus('Uploading Profile Picture...');
                const assetId = await uploadToSanity(profileImage);
                patchObject.faceImage = { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
            }

            if (idFront || idBack) {
                setUploadStatus('Uploading ID Photos...');
                const photos = [];
                if (idFront) {
                    const fId = await uploadToSanity(idFront);
                    photos.push({ _type: 'image', asset: { _type: 'reference', _ref: fId }, _key: 'front' });
                }
                if (idBack) {
                    const bId = await uploadToSanity(idBack);
                    photos.push({ _type: 'image', asset: { _type: 'reference', _ref: bId }, _key: 'back' });
                }
                if (photos.length > 0) patchObject.idPhotos = photos;
            }

            if (licenseFront || licenseBack) {
                setUploadStatus('Uploading License Photos...');
                const photos = [];
                if (licenseFront) {
                    const fId = await uploadToSanity(licenseFront);
                    photos.push({ _type: 'image', asset: { _type: 'reference', _ref: fId }, _key: 'front' });
                }
                if (licenseBack) {
                    const bId = await uploadToSanity(licenseBack);
                    photos.push({ _type: 'image', asset: { _type: 'reference', _ref: bId }, _key: 'back' });
                }
                if (photos.length > 0) patchObject.licensePhotos = photos;
            }

            if (insurance) {
                setUploadStatus('Uploading Insurance Card...');
                const assetId = await uploadToSanity(insurance);
                patchObject.insuranceCard = { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
            }

            if (revenueLicense) {
                setUploadStatus('Uploading Revenue License...');
                const assetId = await uploadToSanity(revenueLicense);
                patchObject.vehicleLicenseImage = { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
            }

            // --- Commit Changes ---
            setUploadStatus('Saving Data...');
            
            // FIX: updatedUser kiyanne Object ekak (Array nemei)
            const updatedUser = await client
                .patch(user._id)
                .set(patchObject)
                .commit({ returnDocuments: true });
            
            // --- CHANGE: [0] ain kala ---
            login(updatedUser); 
            
            Toast.show({ type: 'success', text1: 'Profile Updated Successfully!' });
            navigation.goBack();

        } catch (err) {
            console.error(err);
            Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Please try again.' });
        } finally {
            setIsSaving(false);
            setUploadStatus('');
        }
    };

    const ImageUploadBox = ({ label, imageUri, onPress, placeholderIcon = "camera-outline" }) => (
        <TouchableOpacity style={styles.imageBox} onPress={onPress}>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
                <View style={styles.placeholderContainer}>
                    <Ionicons name={placeholderIcon} size={30} color={COLORS.textLight} />
                    <Text style={styles.uploadText}>{label}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const currentProfilePic = user?.faceImage ? urlFor(user.faceImage).width(200).url() : null;

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="close-outline" size={30} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Profile & Docs</Text>
                </View>

                <ScrollView style={styles.container}>
                    
                    <View style={styles.profilePicContainer}>
                        <TouchableOpacity onPress={() => pickImage(setProfileImage)}>
                            <Image 
                                source={{ uri: profileImage || currentProfilePic || 'https://placehold.co/150' }} 
                                style={styles.profileImage} 
                            />
                            <View style={styles.cameraBadge}>
                                <Ionicons name="camera" size={18} color={COLORS.white} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.helperText}>Tap to change profile photo</Text>
                    </View>

                    <Text style={styles.sectionHeader}>Personal Details</Text>
                    <CustomTextInput iconName="person-outline" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
                    <CustomTextInput iconName="call-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    <CustomTextInput iconName="card-outline" placeholder="NIC Number" value={idNumber} onChangeText={setIdNumber} />
                    <CustomTextInput iconName="car-sport-outline" placeholder="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} />

                    <Text style={styles.sectionHeader}>Documents (Tap to Upload)</Text>
                    
                    <Text style={styles.subLabel}>NIC Photos (Front & Back)</Text>
                    <View style={styles.row}>
                        <ImageUploadBox label="NIC Front" imageUri={idFront} onPress={() => pickImage(setIdFront)} />
                        <ImageUploadBox label="NIC Back" imageUri={idBack} onPress={() => pickImage(setIdBack)} />
                    </View>

                    <Text style={styles.subLabel}>Driving License (Front & Back)</Text>
                    <View style={styles.row}>
                        <ImageUploadBox label="License Front" imageUri={licenseFront} onPress={() => pickImage(setLicenseFront)} />
                        <ImageUploadBox label="License Back" imageUri={licenseBack} onPress={() => pickImage(setLicenseBack)} />
                    </View>

                    <Text style={styles.subLabel}>Other Documents</Text>
                    <View style={styles.row}>
                        <ImageUploadBox label="Insurance Card" imageUri={insurance} onPress={() => pickImage(setInsurance)} />
                        <ImageUploadBox label="Revenue License" imageUri={revenueLicense} onPress={() => pickImage(setRevenueLicense)} />
                    </View>

                    <View style={styles.spacer} />
                    
                    {isSaving && <Text style={styles.statusText}>{uploadStatus}</Text>}

                    <CustomButton 
                        title={isSaving ? 'Saving...' : 'Save Changes'} 
                        onPress={handleSave} 
                        disabled={isSaving}
                        style={{marginTop: 10, marginBottom: 40}}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    headerContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backButton: { padding: 5 },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginLeft: 15 },
    container: { flex: 1, padding: 20 },
    
    profilePicContainer: { alignItems: 'center', marginBottom: 20 },
    profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: COLORS.primaryYellow, backgroundColor: COLORS.lightBackground },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.textDark, padding: 6, borderRadius: 15 },
    helperText: { color: COLORS.textLight, fontSize: 12, marginTop: 5 },

    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginTop: 15, marginBottom: 10 },
    subLabel: { fontSize: 14, color: COLORS.textNormal, marginTop: 10, marginBottom: 5, marginLeft: 5 },
    
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    imageBox: {
        width: '48%',
        height: 100,
        backgroundColor: COLORS.lightBackground,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderContainer: { alignItems: 'center' },
    uploadText: { color: COLORS.textLight, fontSize: 12, marginTop: 5 },
    
    spacer: { height: 20 },
    statusText: { textAlign: 'center', color: COLORS.primaryYellow, fontWeight: 'bold', marginBottom: 10 },
});

export default EditProfileScreen;