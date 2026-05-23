import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {api, NotificationItem} from '../../../services/api';
import {connectSocket} from '../../../services/socket';

const iconMap: Record<string, {icon: string; bg: string; iconColor: string}> = {
  purchase: {icon: 'alert-circle-outline', bg: '#FFF2E7', iconColor: '#FF4D12'},
  completion: {icon: 'chatbubble-ellipses', bg: '#E8F7FF', iconColor: '#10A7DA'},
  reminder: {icon: 'time-outline', bg: '#FFE8E3', iconColor: '#FF4D12'},
  message: {icon: 'mail-outline', bg: '#E8F7FF', iconColor: '#10A7DA'},
  system: {icon: 'information-circle-outline', bg: '#F3F4F6', iconColor: '#6B7280'},
};

const NotificationScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(data);
        const socket = await connectSocket();
        socket.on('new_notification', (notif: any) => {
          setNotifications(prev => [{
            id: notif.id || Date.now().toString(),
            type: notif.type,
            title: notif.title,
            body: notif.body || null,
            time: notif.time || 'Just now',
            isRead: false,
            // Carry extra fields for navigation
            chatId: notif.chatId,
            senderName: notif.senderName,
          } as any, ...prev]);
        });
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleTap = (item: NotificationItem) => {
    // Mark as read
    setReadIds(prev => new Set(prev).add(item.id));
    try { api.markNotificationRead(item.id); } catch (_) {}

    // If it's a message notification, navigate to chat
    if (item.type === 'message') {
      const extra = (item as any).chatId ? item : parseBody(item);
      const chatId = (extra as any).chatId;
      const senderName = (extra as any).senderName || item.title.replace('Message from ', '');
      const senderId = (extra as any).senderId || '';
      if (chatId) {
        navigation.navigate('ChatScreen', {
          userId: senderId,
          name: senderName,
          chatId,
        });
        return;
      }
    }

    // Otherwise show detail modal
    setSelected(item);
  };

  // Try to parse body as JSON for message notifications
  const parseBody = (item: NotificationItem): any => {
    try {
      if (item.body) return JSON.parse(item.body);
    } catch (_) {}
    return item;
  };

  const renderNotificationItem = (item: NotificationItem) => {
    const style = iconMap[item.type] || iconMap.system;
    const isSystem = item.type === 'system';
    const isMessage = item.type === 'message';
    const isRead = readIds.has(item.id) || item.isRead;

    // For message notifications, parse the body JSON for preview text
    let bodyPreview: string | null = null;
    if (isMessage && item.body) {
      try {
        const parsed = JSON.parse(item.body);
        bodyPreview = parsed.text || item.body;
      } catch (_) {
        bodyPreview = item.body;
      }
    } else {
      bodyPreview = item.body;
    }
    if (bodyPreview && bodyPreview.length > 60) {
      bodyPreview = bodyPreview.substring(0, 60) + '...';
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.notificationItem, !isRead && styles.unreadItem]}
        onPress={() => handleTap(item)}
        activeOpacity={0.7}
      >
        {/* Unread indicator dot */}
        {!isRead && <View style={styles.unreadDot} />}

        <View style={[styles.iconContainer, {backgroundColor: style.bg}]}>
          {isSystem ? (
            <Image source={require('../../../../assets/logo.png')} style={styles.logoIcon} />
          ) : (
            <Icon name={style.icon} size={24} color={style.iconColor} />
          )}
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, !isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          {bodyPreview && (
            <Text style={styles.notificationBody} numberOfLines={2}>{bodyPreview}</Text>
          )}
          <View style={styles.timeContainer}>
            <MaterialIcon name="clock-time-four" size={13} color="#B8B8D2" />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={18} color="#ccc" style={{marginLeft: 8}} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10A7DA" style={{marginTop: 40}} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {notifications.map(renderNotificationItem)}
          {notifications.length === 0 && (
            <Text style={styles.empty}>No notifications yet</Text>
          )}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={styles.modalCard}>
            {selected && (() => {
              const s = iconMap[selected.type] || iconMap.system;
              const isSystem = selected.type === 'system';
              const isMessage = selected.type === 'message';
              let displayBody = selected.body || '';
              if (isMessage) {
                try { displayBody = JSON.parse(selected.body || '{}').text || displayBody; } catch (_) {}
              }
              return (
                <>
                  <View style={[styles.modalIcon, {backgroundColor: s.bg}]}>
                    {isSystem ? (
                      <Image source={require('../../../../assets/logo.png')} style={styles.modalLogo} />
                    ) : (
                      <Icon name={s.icon} size={32} color={s.iconColor} />
                    )}
                  </View>
                  <Text style={styles.modalTitle}>{selected.title}</Text>
                  {displayBody ? (
                    <Text style={styles.modalBody}>{displayBody}</Text>
                  ) : null}
                  <View style={styles.modalTime}>
                    <MaterialIcon name="clock-time-four" size={14} color="#999" />
                    <Text style={styles.modalTimeText}>{selected.time}</Text>
                  </View>
                  <TouchableOpacity style={styles.modalClose} onPress={() => setSelected(null)}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    backgroundColor: '#F2F4F7', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, height: 56, position: 'relative',
    borderBottomWidth: 1, borderBottomColor: '#F2F4F7',
  },
  backButton: {padding: 8, position: 'absolute', left: 8, zIndex: 1},
  headerTitle: {fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', color: '#333'},
  scrollView: {flex: 1},
  scrollViewContent: {flexGrow: 1, paddingVertical: 16},
  notificationItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16,
    marginVertical: 6, borderRadius: 12, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 3,
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: '#F0F7FF',
    borderLeftWidth: 3,
    borderLeftColor: '#10A7DA',
  },
  unreadDot: {
    position: 'absolute', top: 12, right: 12, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#10A7DA', zIndex: 1,
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  logoIcon: {width: 30, height: 30, resizeMode: 'contain'},
  notificationContent: {flex: 1, justifyContent: 'center'},
  notificationTitle: {fontSize: 15, color: '#333', fontWeight: '600', marginBottom: 2},
  unreadTitle: {color: '#1F2937'},
  notificationBody: {fontSize: 13, color: '#666', marginBottom: 4, lineHeight: 18},
  timeContainer: {flexDirection: 'row', alignItems: 'center'},
  timeText: {fontSize: 12, color: '#B8B8D2', marginLeft: 4},
  empty: {textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16},
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 360, alignItems: 'center',
  },
  modalIcon: {
    width: 64, height: 64, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalLogo: {width: 40, height: 40, resizeMode: 'contain'},
  modalTitle: {fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8},
  modalBody: {fontSize: 15, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 16},
  modalTime: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  modalTimeText: {fontSize: 13, color: '#999', marginLeft: 4},
  modalClose: {
    backgroundColor: '#10A7DA', paddingHorizontal: 32, paddingVertical: 10,
    borderRadius: 10,
  },
  modalCloseText: {color: '#fff', fontSize: 15, fontWeight: '600'},
});

export default NotificationScreen;
