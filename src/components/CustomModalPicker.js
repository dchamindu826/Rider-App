// src/components/CustomModalPicker.js
// --- Apema Lassana Dropdown eka ---

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const CustomModalPicker = ({
  placeholder = 'Select an item...',
  items = [],
  selectedValue,
  onValueChange,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find(item => item.value === selectedValue);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
      }}>
      <Text style={styles.optionText}>{item.label}</Text>
      {selectedValue === item.value && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primaryYellow} />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.disabled]}
        onPress={() => !disabled && setModalVisible(true)}>
        <Text
          style={[
            styles.pickerButtonText,
            !selectedItem && styles.placeholderText,
          ]}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={[styles.modalOverlay, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value.toString()}
              renderItem={renderItem}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerButtonText: { fontSize: 16, color: COLORS.textDark },
  placeholderText: { color: COLORS.textLight },
  disabled: { backgroundColor: COLORS.lightBackground, opacity: 0.7 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '50%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 15,
    marginBottom: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: { fontSize: 18, color: COLORS.textNormal },
});

export default CustomModalPicker;