import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../models/types';
import {api} from '../../../services/api';
import {Dimensions} from 'react-native';

const {width} = Dimensions.get('window');
const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface AvailabilitySlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

interface BookedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

const DAY_INDEX: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

// Convert "08:00" (24h) to "08:00 AM" (12h)
function to12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

// Convert "10:30 AM" to "10:30"
function to24(time12: string): string {
  const [t, p] = time12.split(' ');
  let [h, m] = t.split(':').map(Number);
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

type Props = {
  route: RouteProp<RootStackParamList, 'AppointmentScreen'>;
  navigation: StackNavigationProp<RootStackParamList>;
};

const AppointmentScreen: React.FC<Props> = ({route, navigation}) => {
  const {tutor} = route.params;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load tutor's real availability from the API
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getTutorById(tutor.id);
        const av = (data as any).availability || [];
        const booked = (data as any).bookedSlots || [];
        setAvailability(av);
        setBookedSlots(booked);

        // Auto-select first available day
        if (av.length > 0) {
          setSelectedDay(av[0].dayOfWeek);
        }
      } catch (err) {
        console.error('Failed to load tutor availability:', err);
        Alert.alert('Error', 'Could not load availability');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tutor.id]);

  // Days the tutor is available on
  const availableDays = availability
    .map(a => a.dayOfWeek)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  // Time slots for the selected day — each availability window is one bookable block
  const daySlots = availability.filter(a => a.dayOfWeek === selectedDay);

  // Figure out the date for the selected day (next occurrence)
  const getDateForDay = (day: string): string => {
    const today = new Date();
    const todayIdx = today.getDay();
    const targetIdx = DAY_INDEX[day] ?? 0;
    let daysToAdd = targetIdx - todayIdx;
    if (daysToAdd <= 0) daysToAdd += 7;
    const d = new Date(today);
    d.setDate(today.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  };

  // Check if a specific availability slot is already booked (same date + start time)
  const isSlotBooked = (slot: AvailabilitySlot): boolean => {
    const date = getDateForDay(selectedDay);
    return bookedSlots.some(
      b => b.date === date && b.startTime === slot.startTime,
    );
  };

  const handleSetAppointment = async () => {
    if (!selectedSlot || !selectedDay) return;
    setSubmitting(true);
    try {
      const date = getDateForDay(selectedDay);
      await api.createAppointment({
        tutorId: tutor.id,
        date,
        day: selectedDay,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0}]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color="#1F2A37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Make Schedule</Text>
          <View style={styles.placeholderRight} />
        </View>
        <ActivityIndicator size="large" color="#52B6DF" style={{marginTop: 60}} />
      </SafeAreaView>
    );
  }

  if (availability.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0}]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={24} color="#1F2A37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Make Schedule</Text>
          <View style={styles.placeholderRight} />
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
          <Icon name="calendar-outline" size={60} color="#ccc" />
          <Text style={{fontSize: 18, color: '#666', marginTop: 16, textAlign: 'center'}}>
            This tutor hasn't set their availability yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <View style={[styles.header, {paddingTop: Platform.OS === 'ios' ? insets.top > 0 ? insets.top : 10 : 0}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color="#1F2A37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make Schedule</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Day selector - only tutor's available days */}
        <Text style={styles.sectionLabel}>Select Date</Text>
        <View style={styles.daysGrid}>
          {WEEK_DAYS.map(day => {
            const isAvailable = availableDays.includes(day);
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  isSelected && styles.selectedDayButton,
                  !isAvailable && styles.unavailableDayButton,
                ]}
                onPress={() => {
                  if (isAvailable) {
                    setSelectedDay(day);
                    setSelectedSlot(null);
                  }
                }}
                disabled={!isAvailable}
              >
                <Text style={[
                  styles.dayButtonText,
                  isSelected && styles.selectedDayText,
                  !isAvailable && styles.unavailableDayText,
                ]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time slots — each availability window is one bookable block */}
        <Text style={styles.sectionLabel}>Available Time</Text>
        {daySlots.length > 0 ? (
          <View style={styles.timeGrid}>
            {daySlots.map(slot => {
              const booked = isSlotBooked(slot);
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.selectedTimeSlot,
                    booked && styles.bookedTimeSlot,
                  ]}
                  onPress={() => !booked && setSelectedSlot(slot)}
                  disabled={booked}
                >
                  <Text style={[
                    styles.timeText,
                    isSelected && styles.selectedTimeText,
                    booked && styles.bookedTimeText,
                  ]}>{to12(slot.startTime)} - {to12(slot.endTime)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noSlots}>Select a day to see available times</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.setAppointmentButton,
          {marginBottom: Platform.OS === 'ios' ? insets.bottom > 0 ? insets.bottom : 16 : 16},
          (!selectedSlot || submitting) && {opacity: 0.5},
        ]}
        onPress={handleSetAppointment}
        disabled={!selectedSlot || submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.setAppointmentText}>
            {selectedSlot
              ? `Book ${selectedDay} ${to12(selectedSlot.startTime)} - ${to12(selectedSlot.endTime)}`
              : 'Select a time'}
          </Text>
        )}
      </TouchableOpacity>

      <Modal animationType="fade" transparent visible={showSuccessModal} onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="calendar" size={40} color="#52B6DF" />
            <Text style={styles.modalTitle}>Appointment Done!</Text>
          </View>
        </View>
      </Modal>
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
  content: {flex: 1},
  sectionLabel: {
    fontSize: 20, fontWeight: '600', color: '#1F2937',
    marginTop: 24, marginBottom: 16, marginHorizontal: 16,
  },
  // Days
  daysGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16,
  },
  dayButton: {
    width: (width - 80) / 5, height: 56,
    backgroundColor: '#fff', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  selectedDayButton: {backgroundColor: '#52B6DF', borderColor: '#52B6DF'},
  unavailableDayButton: {backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', opacity: 0.4},
  dayButtonText: {fontSize: 14, color: '#6B7280', fontWeight: '500'},
  selectedDayText: {color: '#fff'},
  unavailableDayText: {color: '#ccc'},
  // Times
  timeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16, marginBottom: 40,
  },
  timeSlot: {
    width: (width - 48), paddingVertical: 14,
    backgroundColor: '#F3F4F6', borderRadius: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  selectedTimeSlot: {backgroundColor: '#52B6DF', borderColor: '#52B6DF'},
  bookedTimeSlot: {backgroundColor: '#FEE2E2', borderColor: '#FECACA', opacity: 0.7},
  timeText: {fontSize: 13, color: '#6B7280'},
  selectedTimeText: {color: '#fff'},
  bookedTimeText: {color: '#EF4444'},
  noSlots: {textAlign: 'center', color: '#999', marginTop: 20, fontSize: 16},
  // Button
  setAppointmentButton: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#52B6DF',
    paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  setAppointmentText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16,
    padding: 24, alignItems: 'center', justifyContent: 'center',
    width: '80%', height: '40%',
  },
  modalTitle: {fontSize: 24, fontWeight: '600', color: '#fff', marginTop: 16},
});

export default AppointmentScreen;
