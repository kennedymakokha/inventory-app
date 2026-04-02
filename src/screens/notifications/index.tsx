import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Switch, Modal, TextInput, ScrollView, Platform,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/themeContext';
import { NotificationItem, NotificationType } from '../../../models';
import { getNotificationsById, ReadNotification, saveNotification } from '../../services/Notification.service';
import RadialFab from '../../components/multiFab';
import { useNavigation } from '@react-navigation/native';
import { usePostNotificationMutation } from '../../services/notificationsApi';

const NotificationsScreen = ({ route }: any) => {
  const { user } = route.params;
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [postNofication, { isLoading }] = usePostNotificationMutation({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newNoti, setNewNoti] = useState({
    title: '',
    description: '',
    type: 'system-update' as NotificationType
  });
  const [selectedNoti, setSelectedNoti] = useState<NotificationItem | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; label: string }> = {
    'system-update': { icon: 'refresh-circle', color: '#3b82f6', label: 'Update' },
    'agent-message': { icon: 'headset', color: '#22c55e', label: 'Agent' },
    'admin-warning': { icon: 'alert-circle', color: '#ef4444', label: 'Warning' },
    'admin-message': { icon: 'ribbon', color: '#8b5cf6', label: 'Admin' },
    'congratulatory': { icon: 'trophy', color: '#f59e0b', label: 'Congrats' },
  };

  // Calculate counts for badges
  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      all: notifications.filter(n => n.unread === 1).length,
    };

    Object.keys(TYPE_CONFIG).forEach(key => {
      counts[key] = notifications.filter(
        n => n.type === key && n.unread === 1
      ).length;
    });

    return counts;
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    try {

      const data = await getNotificationsById(user?.user_id || user?._id);

      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => { fetchNotifications() }, [fetchNotifications]);

  const handleSaveNotification = async () => {
    if (!newNoti.title || !newNoti.description) return Alert.alert("Please fill in all fields");
    const payload = {
      ...newNoti,
      user_id: user.user_id || user._id,
      unread: true,
    };
    await postNofication(payload).unwrap();
    // const data = await getNotificationsById(user?.user_id || user?._id);
    // setNotifications(data.notifications || []);
    // Implement your service call
    setCreateModalVisible(false);
    setNewNoti({ title: '', description: '', type: 'system-update' });
  };

  const filteredData = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);
  const handleOpenNotification = async (item: NotificationItem) => {
    setSelectedNoti(item);
    setViewModalVisible(true);

    if (item.unread) {
      try {
        await ReadNotification(item.notification_id);
        const data = await getNotificationsById(user?.user_id || user?._id);
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
  };

  const renderBadge = (type: NotificationType | 'all') => {
    const isActive = activeFilter === type;
    const config = type === 'all' ? { color: colors.primary, label: 'All' } : TYPE_CONFIG[type];

    return (
      <TouchableOpacity
        key={type}
        onPress={() => setActiveFilter(type)}
        style={[
          styles.badge,
          { backgroundColor: isActive ? config.color : colors.card, borderColor: colors.border }
        ]}
      >
        <Text style={[styles.badgeText, { color: isActive ? '#fff' : colors.text }]}>
          {config.label}
        </Text>
        <View style={[styles.countBubble, { backgroundColor: isActive ? '#fff' : config.color }]}>
          <Text style={[styles.countText, { color: isActive ? config.color : '#fff' }]}>
            {stats[type] || 0}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const config = TYPE_CONFIG[item.type];
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpenNotification(item)}
        style={[
          styles.notiCard,
          {
            backgroundColor: item.unread === 1
              ? colors.card
              : colors.card + 'CC', // slightly faded
            borderColor: item.unread === 1
              ? config.color
              : colors.border,
            borderWidth: item.unread === 1 ? 1.5 : 1,
            opacity: item.unread === 1 ? 1 : 0.6
          }
        ]}
      >
        <View style={[styles.typeStrip, { backgroundColor: config.color }]} />
        <View style={styles.cardContent}>
          <View style={[styles.iconBox, { backgroundColor: config.color + '15' }]}>
            <Ionicons name={config.icon} size={22} color={config.color} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.rowBetween}>
              <Text style={[styles.typeLabel, { color: config.color }]}>
                {config.label} {item.unread === 1 && "• NEW"}
              </Text>
              <Text style={styles.timeText}>{item.createdAt}</Text>
            </View>

            <Text style={[styles.notiTitle, { color: colors.text }]}>{item.title}</Text>

            {/* 2. LIMIT WORDS/LINES */}
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[styles.description, { color: colors.subText }]}
            >
              {item.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* 1. FIXED TOP HEADER */}
      <View style={[styles.topHeader, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.screenTitle, { color: colors.text }]}>Alerts</Text>

          <View style={styles.toggleWrapper}>
            <Ionicons name="notifications-outline" size={16} color={colors.subText} />
            <Switch
              value={activeFilter === 'agent-message'}
              onValueChange={(val) => setActiveFilter(val ? 'agent-message' : 'all')}
            />
          </View>
        </View>

        {/* 2. HORIZONTAL FILTER BAR */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {renderBadge('all')}
          {(Object.keys(TYPE_CONFIG) as NotificationType[]).map(renderBadge)}
        </ScrollView>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listPadding}
      />

      <RadialFab mainColor={colors.primary} mainIcon="add" mainAction={() => setCreateModalVisible(true)} />

      {/* CREATE MODAL REMAINS THE SAME AS PREVIOUS STEP */}
      <Modal visible={createModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Notification</Text>

            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {(Object.keys(TYPE_CONFIG) as NotificationType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewNoti({ ...newNoti, type: t })}
                  style={[
                    styles.typeOption,
                    { borderColor: newNoti.type === t ? TYPE_CONFIG[t].color : colors.border }
                  ]}
                >
                  <Ionicons name={TYPE_CONFIG[t].icon} size={18} color={TYPE_CONFIG[t].color} />
                  <Text style={{ fontSize: 10, color: colors.text, marginTop: 4 }}>{TYPE_CONFIG[t].label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              placeholder="Title"
              placeholderTextColor={colors.subText}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={newNoti.title}
              onChangeText={(t) => setNewNoti({ ...newNoti, title: t })}
            />

            <TextInput
              placeholder="Description"
              placeholderTextColor={colors.subText}
              multiline
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
              value={newNoti.description}
              onChangeText={(t) => setNewNoti({ ...newNoti, description: t })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: colors.subText }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNotification} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Notification</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={viewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, minHeight: 300 }]}>
            {selectedNoti && (
              <>
                <View style={[styles.iconBox, { backgroundColor: TYPE_CONFIG[selectedNoti.type].color + '15', marginBottom: 15 }]}>
                  <Ionicons name={TYPE_CONFIG[selectedNoti.type].icon} size={30} color={TYPE_CONFIG[selectedNoti.type].color} />
                </View>

                <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center' }]}>
                  {selectedNoti.title}
                </Text>

                <ScrollView style={{ maxHeight: 300, marginVertical: 20 }}>
                  <Text style={[styles.fullDescription, { color: colors.text }]}>
                    {selectedNoti.description}
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setViewModalVisible(false)}
                  style={[styles.saveBtn, { backgroundColor: colors.primary, width: '100%' }]}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 10 },
  typeSelector: { marginBottom: 20, flexDirection: 'row' },
  typeOption: { width: 70, height: 70, borderRadius: 15, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },

  notiCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  fullDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  topHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 15,
    zIndex: 100,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  filterScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 5
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6
  },
  countBubble: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center'
  },
  countText: {
    fontSize: 10,
    fontWeight: '900'
  },
  listPadding: {
    padding: 20,
    paddingBottom: 100
  },

  typeStrip: { height: 4, width: '100%' },
  cardContent: { padding: 15, flexDirection: 'row' },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  notiTitle: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  description: { fontSize: 13, marginTop: 4 },
  timeText: { fontSize: 10, color: '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 400 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 2, padding: 15, borderRadius: 15, alignItems: 'center' }
});

export default NotificationsScreen;