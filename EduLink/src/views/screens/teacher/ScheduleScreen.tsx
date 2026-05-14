import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../models/types';
import { WeekDaySelector } from '../../screens/stacks/components/WeekDaySelector';
import { TimeSlotSelector } from '../../screens/stacks/components/TimeSlotSelector';
import ClassCard from './components/ClassCard';
import FilterModal from './components/FilterModal';
import { api } from '../../../services/api';

type ScheduleNavigationProp = StackNavigationProp<RootStackParamList>;

const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation<ScheduleNavigationProp>();
  const [activeTab, setActiveTab] = useState<'classes' | 'availability'>('classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('MON');
  const [selectedTime, setSelectedTime] = useState('12:30 PM');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getTeacherClasses();
        setClasses(data);
      } catch (err) {
        console.error('Failed to load classes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClassPress = (classId: string) => {
    navigation.navigate('UpcomingClassScreen');
  };

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleSaveAvailability = async () => {
    try {
      // Convert "12:30 PM" to "12:30"
      const time24 = convertTo24Hour(selectedTime);
      await api.setAvailability({
        dayOfWeek: selectedDay,
        startTime: time24,
        endTime: time24, // User selects one time; could extend to range
        isRecurring: true,
      });
      console.log('Availability saved');
    } catch (err) {
      console.error('Failed to save availability:', err);
    }
  };

  const convertTo24Hour = (time12: string): string => {
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  };

  const filteredClasses = classes.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.studentName.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && statusFilter !== 'All') {
      if (item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    if (dayFilter && dayFilter !== 'All') {
      const dayFromDate = item.date.split(',')[0]?.trim() || '';
      const short = dayFilter.substring(0, 3);
      if (!dayFromDate.toLowerCase().includes(short.toLowerCase())) return false;
    }
    return true;
  });

  const handleApplyFilters = (filters: { status: string; day: string }) => {
    setStatusFilter(filters.status);
    setDayFilter(filters.day);
    setFilterModalVisible(false);
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setDayFilter('');
    setFilterModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{alignItems:'center', backgroundColor:'#F2F4F7'}}>
        <Text style={styles.screenTitle}>scheduled</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Classes"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Icon name="options-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <View style={styles.tabButtonsContainer}>
          <View style={styles.singleTab}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'classes' && styles.activeTabButton]}
              onPress={() => setActiveTab('classes')}>
              <Text style={[styles.tabText, activeTab === 'classes' && styles.activeTabText]}>
                Classes
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.singleTab}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'availability' && styles.activeTabButton]}
              onPress={() => setActiveTab('availability')}>
              <Text style={[styles.tabText, activeTab === 'availability' && styles.activeTabText]}>
                availability schedule
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.tabIndicator} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#10A7DA" style={{marginTop: 40}} />
        ) : activeTab === 'classes' ? (
          <View style={styles.classesContainer}>
            {filteredClasses.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                onPress={() => handleClassPress(item.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.availabilityContainer}>
            <WeekDaySelector
              selectedDay={selectedDay}
              onDaySelect={handleDaySelect}
            />
            <TimeSlotSelector
              selectedTime={selectedTime}
              onTimeSelect={handleTimeSelect}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveAvailability}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={{ status: statusFilter, day: dayFilter }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'SF-Pro-Display-Semibold',
    color: '#1F2A37',
    textAlign: 'center',
    marginVertical: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 6,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'SF-Pro-Display-Regular',
    fontSize: 16,
    color: '#1F2A37',
  },
  filterButton: {
    padding: 4,
  },
  tabContainer: {
    marginBottom: 16,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  singleTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#10A7DA',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Regular',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#10A7DA',
    fontFamily: 'SF-Pro-Display-Semibold',
  },
  tabIndicator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '90%',
    alignSelf: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  classesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  availabilityContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  saveButton: {
    backgroundColor: '#10A7DA',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    marginHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Semibold',
    color: '#FFFFFF',
  },
});

export default ScheduleScreen;
