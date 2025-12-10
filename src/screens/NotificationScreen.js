// src/screens/NotificationsScreen.js (Rider App)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { client } from '../sanity/sanityClient';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch logic... (Sanity query එක මෙතන තියෙනවා කියලා උපකල්පනය කරමි)
    const fetchNotifications = async () => {
        try {
            const query = `*[_type == "announcement" && (target == "all" || target == "riders")] | order(publishedAt desc)`;
            const data = await client.fetch(query);
            setNotifications(data);
        } catch (error) {
            console.log("Error fetching notifications", error);
        } finally {
            setLoading(false);
        }
    };
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Ionicons name="megaphone-outline" size={24} color={COLORS.primaryYellow} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.date}>{new Date(item.publishedAt).toLocaleString()}</Text>
        <Text style={styles.cardBody}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={30} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryYellow} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No notifications yet.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, // Padding එක වැඩි කළා
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border,
    marginTop: 10 // Status bar එකෙන් පොඩ්ඩක් ඈත් කළා
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textDark },
  listContent: { padding: 20 },
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 15, 
    flexDirection: 'row',
    elevation: 3, // Android Shadow
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3
  },
  icon: { marginRight: 15, marginTop: 2 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 5 },
  date: { fontSize: 12, color: COLORS.textLight, marginBottom: 5 },
  cardBody: { fontSize: 14, color: COLORS.textNormal, lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textLight, fontSize: 16 }
});

export default NotificationsScreen;