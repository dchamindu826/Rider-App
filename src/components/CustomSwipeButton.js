// src/components/CustomSwipeButton.js
// --- FINAL: Custom Built Swipe Button (No Library) ---

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const BUTTON_HEIGHT = 55;
const BUTTON_WIDTH = Dimensions.get('window').width - 40; // Padding deka adu kala
const SWIPE_THRESHOLD = BUTTON_WIDTH * 0.7; // 70% swipe kalama accept wenawa

const CustomSwipeButton = ({ title, onSwipeSuccess }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const [textOpacity, setTextOpacity] = useState(1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (isCompleted) return;
        // Forward movement only
        if (gestureState.dx > 0 && gestureState.dx <= BUTTON_WIDTH - BUTTON_HEIGHT) {
          pan.setValue({ x: gestureState.dx, y: 0 });
          // Fade out text as you swipe
          setTextOpacity(1 - (gestureState.dx / SWIPE_THRESHOLD));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isCompleted) return;
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Success!
          setIsCompleted(true);
          Animated.spring(pan, {
            toValue: { x: BUTTON_WIDTH - BUTTON_HEIGHT, y: 0 },
            useNativeDriver: false,
          }).start();
          onSwipeSuccess();
        } else {
          // Reset (Spring back)
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          setTextOpacity(1);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <Text style={[styles.text, { opacity: textOpacity }]}>{title} {'>>'}</Text>
      </View>
      
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Ionicons 
            name={isCompleted ? "checkmark" : "chevron-forward"} 
            size={30} 
            color={COLORS.primaryYellow} 
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    width: '100%',
    backgroundColor: COLORS.primaryYellow,
    borderRadius: BUTTON_HEIGHT / 2,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.yellowButtonText,
    fontWeight: 'bold',
    fontSize: 16,
  },
  thumb: {
    height: BUTTON_HEIGHT - 4,
    width: BUTTON_HEIGHT - 4,
    backgroundColor: COLORS.white,
    borderRadius: (BUTTON_HEIGHT - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 2,
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default CustomSwipeButton;