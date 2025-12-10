// src/components/NewOrderPopup.js
// --- FINAL FIX: Earning Calculation & Address Fix ---

import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';

const ORDER_TIMEOUT_SECONDS = 30;

const NewOrderPopup = ({ order, isVisible, onAccept, onIgnore }) => {
    const [countdown, setCountdown] = useState(ORDER_TIMEOUT_SECONDS);
    const timerRef = useRef(null);
    const progressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isVisible) {
            setCountdown(ORDER_TIMEOUT_SECONDS);
            progressAnim.setValue(1); 

            Animated.timing(progressAnim, {
                toValue: 0,
                duration: ORDER_TIMEOUT_SECONDS * 1000,
                useNativeDriver: false,
            }).start();

            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        onIgnore(); 
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } else {
            clearInterval(timerRef.current);
            Animated.timing(progressAnim).stop();
        }

        return () => clearInterval(timerRef.current);
    }, [isVisible]);

    if (!isVisible || !order) {
        return null;
    }

    // --- (FIX) Earning Logic Updated ---
    // perKmCharge nemei, deliveryCharge eken 65% gannawa
    const deliveryFee = order.deliveryCharge || 0;
    const riderEarning = deliveryFee * 0.65; 
    const foodTotal = order.foodTotal || 0;

    const timerWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onIgnore}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>🚨 New Order Available! 🚨</Text>
                    
                    <View style={styles.row}>
                        <Ionicons name="storefront-outline" size={20} color={COLORS.textNormal} style={styles.icon} />
                        <Text style={styles.label}>Pickup:</Text>
                        <Text style={styles.value}>{order.restaurant?.name}</Text>
                    </View>
                    
                    {/* Address eka query eken "address" kiyala map karala ewanawa */}
                    <Text style={styles.subAddress}>{order.restaurant?.address}</Text>
                    
                    <View style={styles.row}>
                        <Ionicons name="person-outline" size={20} color={COLORS.textNormal} style={styles.icon} />
                        <Text style={styles.label}>Dropoff:</Text>
                        <Text style={styles.value}>{order.receiverName}</Text>
                    </View>
                    
                    <View style={styles.line} />

                    <View style={styles.row}>
                        <Ionicons name="cash-outline" size={20} color={COLORS.textNormal} style={styles.icon} />
                        <Text style={styles.label}>Food Total:</Text>
                        <Text style={styles.value}>LKR {foodTotal.toFixed(2)}</Text>
                    </View>

                    <View style={styles.row}>
                        <Ionicons name="wallet-outline" size={20} color={COLORS.success} style={styles.icon} />
                        <Text style={[styles.label, styles.earningLabel]}>Your Earning:</Text>
                        <Text style={[styles.value, styles.earningValue]}>LKR {riderEarning.toFixed(2)}</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <CustomButton
                            title={`Ignore (${countdown}s)`}
                            onPress={onIgnore}
                            variant="secondary"
                            style={{ flex: 1, marginRight: 10 }}
                        />
                        <CustomButton
                            title="Accept"
                            onPress={onAccept}
                            style={{ flex: 1.5 }}
                        />
                    </View>

                    <View style={styles.timerBarContainer}>
                        <Animated.View style={[styles.timerBar, { width: timerWidth }]} />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 30,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    icon: {
        marginRight: 10,
    },
    label: {
        fontSize: 16,
        color: COLORS.textLight,
        marginRight: 5,
    },
    value: {
        fontSize: 16,
        color: COLORS.textDark,
        fontWeight: '500',
        flex: 1, 
    },
    subAddress: {
        fontSize: 13,
        color: COLORS.textLight,
        marginLeft: 30, // Icon ekata align wenna
        marginBottom: 10,
    },
    line: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 10,
    },
    earningLabel: {
        color: COLORS.success,
        fontWeight: 'bold',
    },
    earningValue: {
        color: COLORS.success,
        fontWeight: 'bold',
        fontSize: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    timerBarContainer: {
        height: 5,
        width: '100%',
        backgroundColor: COLORS.border,
        borderRadius: 5,
        marginTop: 20,
        overflow: 'hidden',
    },
    timerBar: {
        height: '100%',
        backgroundColor: COLORS.primaryYellow,
    }
});

export default NewOrderPopup;