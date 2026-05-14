import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { WEEK_DAYS } from './constants';

interface WeekDaySelectorProps {
  selectedDay: string;
  onDaySelect: (day: string) => void;
}

export const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({
  selectedDay,
  onDaySelect,
}) => {
  return (
    <>
      <Text style={styles.selectDateText}>Select Date</Text>
      <View style={styles.weekDaysGrid}>
        <View style={styles.daysGrid}>
          {WEEK_DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDay === day && styles.selectedDayButton,
              ]}
              onPress={() => onDaySelect(day)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDay === day && styles.selectedDayText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  selectDateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  weekDaysGrid: {
    paddingHorizontal: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  dayButton: {
    width: (Dimensions.get('window').width - 80) / 5,
    height: 64,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDayButton: {
    backgroundColor: '#52B6DF',
    borderColor: '#52B6DF',
  },
  dayButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
  },
});
