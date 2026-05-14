import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TIME_SLOTS } from './constants';

interface TimeSlotSelectorProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedTime,
  onTimeSelect,
}) => {
  return (
    <View style={styles.timeSection}>
      <Text style={styles.sectionTitle}>Available Time</Text>
      <View style={styles.timeSlotContainer}>
        {TIME_SLOTS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.timeRow}>
            {row.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot,
                ]}
                onPress={() => onTimeSelect(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.selectedTimeText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timeSection: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  timeSlotContainer: {
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeSlot: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  selectedTimeSlot: {
    backgroundColor: '#52B6DF',
    borderColor: '#52B6DF',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedTimeText: {
    color: '#fff',
  },
});
