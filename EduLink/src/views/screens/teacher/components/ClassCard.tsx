import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ClassScheduleItem } from '../../../../models/types';

interface ClassCardProps {
  item: ClassScheduleItem;
  onPress?: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ item, onPress }) => {
  const { status, date, time } = item;

  // Determine status color and icon
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#4CAF50'; // Green
      case 'canceled':
        return '#F44336'; // Red
      case 'upcoming':
        return '#10A7DA'; // Blue
      default:
        return '#10A7DA';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'canceled':
        return 'Canceled';
      case 'upcoming':
        return 'Upcoming Classes';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      style={styles.classCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        {status !== 'upcoming' && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusTitle()}</Text>
          </View>
        )}
        {status === 'upcoming' && (
          <Text style={styles.upcomingTitle}>{getStatusTitle()}</Text>
        )}
        <Icon name="chevron-forward" size={24} color="#fff" />
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.dateTimeContainer}>
          <Icon name="calendar-outline" size={20} color="#fff" style={styles.dateTimeIcon} />
          <Text style={styles.dateTimeValue}>{date}</Text>
          <Text style={styles.dateTimeLabel}>Appointments Date</Text>
        </View>
        
        <View style={styles.dateTimeContainer}>
          <Icon name="time-outline" size={20} color="#fff" style={styles.dateTimeIcon} />
          <Text style={styles.dateTimeValue}>{time}</Text>
          <Text style={styles.dateTimeLabel}>Appointments Time</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  classCard: {
    backgroundColor: '#0A6E8F',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Semibold',
    color: '#FFFFFF',
  },
  upcomingTitle: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Semibold',
    color: '#FFFFFF',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateTimeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  dateTimeIcon: {
    marginRight: 8,
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 14,
    fontFamily: 'SF-Pro-Display-Semibold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateTimeLabel: {
    fontSize: 12,
    fontFamily: 'SF-Pro-Display-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default ClassCard;
