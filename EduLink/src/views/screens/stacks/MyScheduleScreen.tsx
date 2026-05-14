import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Platform, Alert, ActivityIndicator,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {DeleteModal} from './components/DeleteModal';
import {api} from '../../../services/api';

interface AppointmentItem {
  id: string;
  date: string;
  time: string;
  instructor: {
    id: string;
    name: string;
    role: string;
    avatar: string;
  };
  status?: string;
}

const MyScheduleScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.getAppointments();
        setAppointments(data);
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      await api.cancelAppointment(selectedId);
      setAppointments(prev => prev.filter(a => a.id !== selectedId));
      setShowDeleteModal(false);
      setSelectedId(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel appointment');
    }
  };

  const handleJoinClass = (appointment: AppointmentItem) => {
    navigation.navigate('LiveClassScreen', {
      roomName: appointment.id,
      className: `Class with ${appointment.instructor.name}`,
    });
  };

  const renderAppointmentCard = (appointment: AppointmentItem) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <Text style={styles.cardTitle}>Upcoming Appointments</Text>
      <TouchableOpacity style={styles.chevronRight}>
        <Icon name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.appointmentInfo}>
        <View style={styles.infoBox}>
          <View style={styles.infoContent}>
            <Icon name="calendar-outline" size={24} color="#fff" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.dateText}>{appointment.date}</Text>
              <Text style={styles.subtitleText}>Appointments Date</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoContent}>
            <Icon name="time-outline" size={24} color="#fff" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.dateText}>{appointment.time}</Text>
              <Text style={styles.subtitleText}>Appointments Time</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.instructorCard}>
        <View style={styles.instructorInfo}>
          <Image source={require('../../../../assets/karim.png')} style={styles.avatar} />
          <View>
            <Text style={styles.instructorName}>{appointment.instructor.name}</Text>
            <Text style={styles.instructorRole}>{appointment.instructor.role}</Text>
          </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          {/* Join Class button for upcoming appointments */}
          {(!appointment.status || appointment.status === 'upcoming') && (
            <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinClass(appointment)}>
              <Icon name="videocam-outline" size={18} color="#fff" />
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(appointment.id)}>
            <Icon name="trash-outline" size={20} color="#FF4D12" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My schedule</Text>
        <View style={styles.placeholderRight} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10A8DA" style={{marginTop: 40}} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollView}>
          {appointments.map(renderAppointmentCard)}
        </ScrollView>
      )}

      <DeleteModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Are you sure you want to delete this appointment?"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: {padding: 8, borderRadius: 8},
  placeholderRight: {width: 40, height: 40},
  headerTitle: {fontWeight: '600', fontSize: 18, color: '#1F2937'},
  scrollView: {flexGrow: 1, padding: 16},
  appointmentCard: {
    backgroundColor: '#0A6E8F', borderRadius: 16, padding: 16,
    marginBottom: 16, position: 'relative',
  },
  cardTitle: {color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16},
  chevronRight: {position: 'absolute', right: 16, top: 16},
  appointmentInfo: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16,
  },
  infoBox: {
    justifyContent: 'flex-start', backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12, padding: 12, flex: 1, marginHorizontal: 4,
  },
  infoContent: {alignItems: 'flex-start'},
  infoIcon: {marginBottom: 8},
  infoTextContainer: {alignItems: 'flex-start'},
  dateText: {color: '#fff', fontSize: 14, fontWeight: '500'},
  subtitleText: {color: 'rgba(255, 255, 255, 0.7)', fontSize: 12},
  instructorCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  instructorInfo: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {width: 40, height: 40, borderRadius: 20, marginRight: 12},
  instructorName: {fontSize: 16, fontWeight: '500', color: '#333'},
  instructorRole: {fontSize: 14, color: '#666'},
  joinButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {color: '#fff', fontSize: 13, fontWeight: '600'},
  deleteButton: {padding: 8},
});

export default MyScheduleScreen;
